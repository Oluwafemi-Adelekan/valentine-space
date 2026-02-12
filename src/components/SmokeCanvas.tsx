import { useEffect, useRef } from "react";

/**
 * WebGL Fluid / Smoke simulation adapted from a CodePen.
 * Forced to pink-only splat colors.
 */
export function SmokeCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const config = {
            TEXTURE_DOWNSAMPLE: 1,
            DENSITY_DISSIPATION: 0.98,
            VELOCITY_DISSIPATION: 0.99,
            PRESSURE_DISSIPATION: 0.8,
            PRESSURE_ITERATIONS: 25,
            CURL: 30,
            SPLAT_RADIUS: 0.005,
        };

        interface Pointer {
            id: number;
            x: number;
            y: number;
            dx: number;
            dy: number;
            down: boolean;
            moved: boolean;
            color: number[];
        }

        const pointers: Pointer[] = [];
        const splatStack: number[] = [];

        function createPointer(): Pointer {
            return {
                id: -1, x: 0, y: 0, dx: 0, dy: 0,
                down: false, moved: false,
                color: [0.8, 0.2, 0.4], // pink
            };
        }
        pointers.push(createPointer());

        // --- WebGL setup ---
        const params = { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: false };
        let gl = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null;
        const isWebGL2 = !!gl;
        if (!gl) gl = (canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params)) as WebGL2RenderingContext;
        if (!gl) return;

        const _gl = gl; // non-null alias

        let halfFloat = !isWebGL2 ? _gl.getExtension("OES_texture_half_float") : null;
        let supportLinearFloat: any = _gl.getExtension("OES_texture_half_float_linear");
        if (isWebGL2) {
            _gl.getExtension("EXT_color_buffer_float");
            supportLinearFloat = _gl.getExtension("OES_texture_float_linear");
        }

        _gl.clearColor(0.0, 0.0, 0.0, 0.0); // transparent background

        const internalFormat = isWebGL2 ? (_gl as WebGL2RenderingContext).RGBA16F : _gl.RGBA;
        const internalFormatRG = isWebGL2 ? (_gl as WebGL2RenderingContext).RG16F : _gl.RGBA;
        const formatRG = isWebGL2 ? (_gl as WebGL2RenderingContext).RG : _gl.RGBA;
        const texType = isWebGL2 ? _gl.HALF_FLOAT : (halfFloat as any).HALF_FLOAT_OES;

        // --- Shader compilation ---
        function compileShader(type: number, source: string) {
            const shader = _gl.createShader(type)!;
            _gl.shaderSource(shader, source);
            _gl.compileShader(shader);
            if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) console.error(_gl.getShaderInfoLog(shader));
            return shader;
        }

        class GLProgram {
            uniforms: Record<string, WebGLUniformLocation | null> = {};
            program: WebGLProgram;
            constructor(vs: WebGLShader, fs: WebGLShader) {
                this.program = _gl.createProgram()!;
                _gl.attachShader(this.program, vs);
                _gl.attachShader(this.program, fs);
                _gl.linkProgram(this.program);
                if (!_gl.getProgramParameter(this.program, _gl.LINK_STATUS)) console.error(_gl.getProgramInfoLog(this.program));
                const uc = _gl.getProgramParameter(this.program, _gl.ACTIVE_UNIFORMS);
                for (let i = 0; i < uc; i++) {
                    const name = _gl.getActiveUniform(this.program, i)!.name;
                    this.uniforms[name] = _gl.getUniformLocation(this.program, name);
                }
            }
            bind() { _gl.useProgram(this.program); }
        }

        const baseVS = compileShader(_gl.VERTEX_SHADER,
            `precision highp float; precision mediump sampler2D; attribute vec2 aPosition; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform vec2 texelSize; void main () { vUv = aPosition * 0.5 + 0.5; vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0); vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y); gl_Position = vec4(aPosition, 0.0, 1.0); }`);
        const clearFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTexture; uniform float value; void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`);
        const displayFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTexture; void main () { gl_FragColor = texture2D(uTexture, vUv); }`);
        const splatFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius; void main () { vec2 p = vUv - point.xy; p.x *= aspectRatio; vec3 splat = exp(-dot(p, p) / radius) * color; vec3 base = texture2D(uTarget, vUv).xyz; gl_FragColor = vec4(base + splat, 1.0); }`);
        const advManFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation; vec4 bilerp (in sampler2D sam, in vec2 p) { vec4 st; st.xy = floor(p - 0.5) + 0.5; st.zw = st.xy + 1.0; vec4 uv = st * texelSize.xyxy; vec4 a = texture2D(sam, uv.xy); vec4 b = texture2D(sam, uv.zy); vec4 c = texture2D(sam, uv.xw); vec4 d = texture2D(sam, uv.zw); vec2 f = p - st.xy; return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); } void main () { vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy; gl_FragColor = dissipation * bilerp(uSource, coord); gl_FragColor.a = 1.0; }`);
        const advFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation; void main () { vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize; gl_FragColor = dissipation * texture2D(uSource, coord); }`);
        const divFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; vec2 sampleVelocity (in vec2 uv) { vec2 multiplier = vec2(1.0, 1.0); if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; } if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; } if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; } if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; } return multiplier * texture2D(uVelocity, uv).xy; } void main () { float L = sampleVelocity(vL).x; float R = sampleVelocity(vR).x; float T = sampleVelocity(vT).y; float B = sampleVelocity(vB).y; float div = 0.5 * (R - L + T - B); gl_FragColor = vec4(div, 0.0, 0.0, 1.0); }`);
        const curlFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; void main () { float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y; float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x; float vorticity = R - L - T + B; gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0); }`);
        const vortFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt; void main () { float L = texture2D(uCurl, vL).y; float R = texture2D(uCurl, vR).y; float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x; float C = texture2D(uCurl, vUv).x; vec2 force = vec2(abs(T) - abs(B), abs(R) - abs(L)); force *= 1.0 / length(force + 0.00001) * curl * C; vec2 vel = texture2D(uVelocity, vUv).xy; gl_FragColor = vec4(vel + force * dt, 0.0, 1.0); }`);
        const pressFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uPressure; uniform sampler2D uDivergence; vec2 boundary (in vec2 uv) { uv = min(max(uv, 0.0), 1.0); return uv; } void main () { float L = texture2D(uPressure, boundary(vL)).x; float R = texture2D(uPressure, boundary(vR)).x; float T = texture2D(uPressure, boundary(vT)).x; float B = texture2D(uPressure, boundary(vB)).x; float C = texture2D(uPressure, vUv).x; float divergence = texture2D(uDivergence, vUv).x; float pressure = (L + R + B + T - divergence) * 0.25; gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0); }`);
        const gradFS = compileShader(_gl.FRAGMENT_SHADER,
            `precision highp float; precision mediump sampler2D; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uPressure; uniform sampler2D uVelocity; vec2 boundary (in vec2 uv) { uv = min(max(uv, 0.0), 1.0); return uv; } void main () { float L = texture2D(uPressure, boundary(vL)).x; float R = texture2D(uPressure, boundary(vR)).x; float T = texture2D(uPressure, boundary(vT)).x; float B = texture2D(uPressure, boundary(vB)).x; vec2 velocity = texture2D(uVelocity, vUv).xy; velocity.xy -= vec2(R - L, T - B); gl_FragColor = vec4(velocity, 0.0, 1.0); }`);

        type FBO = [WebGLTexture, WebGLFramebuffer, number];
        type DoubleFBO = { first: FBO; second: FBO; swap: () => void };

        let textureWidth = 0, textureHeight = 0;
        let density: DoubleFBO, velocity: DoubleFBO, pressure: DoubleFBO;
        let divergence: FBO, curl: FBO;

        function createFBO(texId: number, w: number, h: number, intFmt: number, fmt: number, type: number, param: number): FBO {
            _gl.activeTexture(_gl.TEXTURE0 + texId);
            const texture = _gl.createTexture()!;
            _gl.bindTexture(_gl.TEXTURE_2D, texture);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, param);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, param);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
            _gl.texImage2D(_gl.TEXTURE_2D, 0, intFmt, w, h, 0, fmt, type, null);
            const fbo = _gl.createFramebuffer()!;
            _gl.bindFramebuffer(_gl.FRAMEBUFFER, fbo);
            _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, texture, 0);
            _gl.viewport(0, 0, w, h);
            _gl.clear(_gl.COLOR_BUFFER_BIT);
            return [texture, fbo, texId];
        }

        function createDoubleFBO(texId: number, w: number, h: number, intFmt: number, fmt: number, type: number, param: number): DoubleFBO {
            let fbo1 = createFBO(texId, w, h, intFmt, fmt, type, param);
            let fbo2 = createFBO(texId + 1, w, h, intFmt, fmt, type, param);
            return {
                get first() { return fbo1; },
                get second() { return fbo2; },
                swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
            };
        }

        function initFramebuffers() {
            textureWidth = _gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE;
            textureHeight = _gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;
            const linFilter = supportLinearFloat ? _gl.LINEAR : _gl.NEAREST;
            density = createDoubleFBO(0, textureWidth, textureHeight, internalFormat, _gl.RGBA, texType, linFilter);
            velocity = createDoubleFBO(2, textureWidth, textureHeight, internalFormatRG, formatRG, texType, linFilter);
            divergence = createFBO(4, textureWidth, textureHeight, internalFormatRG, formatRG, texType, _gl.NEAREST);
            curl = createFBO(5, textureWidth, textureHeight, internalFormatRG, formatRG, texType, _gl.NEAREST);
            pressure = createDoubleFBO(6, textureWidth, textureHeight, internalFormatRG, formatRG, texType, _gl.NEAREST);
        }
        initFramebuffers();

        const clearProg = new GLProgram(baseVS, clearFS);
        const displayProg = new GLProgram(baseVS, displayFS);
        const splatProg = new GLProgram(baseVS, splatFS);
        const advProg = new GLProgram(baseVS, supportLinearFloat ? advFS : advManFS);
        const divProg = new GLProgram(baseVS, divFS);
        const curlProg = new GLProgram(baseVS, curlFS);
        const vortProg = new GLProgram(baseVS, vortFS);
        const pressProg = new GLProgram(baseVS, pressFS);
        const gradProg = new GLProgram(baseVS, gradFS);

        // Full-screen quad
        _gl.bindBuffer(_gl.ARRAY_BUFFER, _gl.createBuffer());
        _gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), _gl.STATIC_DRAW);
        _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, _gl.createBuffer());
        _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), _gl.STATIC_DRAW);
        _gl.vertexAttribPointer(0, 2, _gl.FLOAT, false, 0, 0);
        _gl.enableVertexAttribArray(0);

        function blit(dest: WebGLFramebuffer | null) {
            _gl.bindFramebuffer(_gl.FRAMEBUFFER, dest);
            _gl.drawElements(_gl.TRIANGLES, 6, _gl.UNSIGNED_SHORT, 0);
        }

        function splat(x: number, y: number, dx: number, dy: number, color: number[]) {
            splatProg.bind();
            _gl.uniform1i(splatProg.uniforms.uTarget, velocity.first[2]);
            _gl.uniform1f(splatProg.uniforms.aspectRatio, canvas.width / canvas.height);
            _gl.uniform2f(splatProg.uniforms.point, x / canvas.width, 1.0 - y / canvas.height);
            _gl.uniform3f(splatProg.uniforms.color, dx, -dy, 1.0);
            _gl.uniform1f(splatProg.uniforms.radius, config.SPLAT_RADIUS);
            blit(velocity.second[1]);
            velocity.swap();
            _gl.uniform1i(splatProg.uniforms.uTarget, density.first[2]);
            // PINK ONLY — force pink color
            _gl.uniform3f(splatProg.uniforms.color, color[0] * 0.3, color[1] * 0.3, color[2] * 0.3);
            blit(density.second[1]);
            density.swap();
        }

        function resizeCanvas() {
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                initFramebuffers();
            }
        }

        let lastTime = Date.now();

        function update() {
            resizeCanvas();
            const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
            lastTime = Date.now();
            _gl.viewport(0, 0, textureWidth, textureHeight);

            if (splatStack.length > 0) {
                for (let m = 0; m < splatStack.pop()!; m++) {
                    // All splats are pink shades
                    const color = [0.7 + Math.random() * 0.3, 0.1 + Math.random() * 0.15, 0.3 + Math.random() * 0.2];
                    const x = canvas.width * Math.random();
                    const y = canvas.height * Math.random();
                    const dx = 1000 * (Math.random() - 0.5);
                    const dy = 1000 * (Math.random() - 0.5);
                    splat(x, y, dx, dy, color);
                }
            }

            advProg.bind();
            _gl.uniform2f(advProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
            _gl.uniform1i(advProg.uniforms.uVelocity, velocity.first[2]);
            _gl.uniform1i(advProg.uniforms.uSource, velocity.first[2]);
            _gl.uniform1f(advProg.uniforms.dt, dt);
            _gl.uniform1f(advProg.uniforms.dissipation, config.VELOCITY_DISSIPATION);
            blit(velocity.second[1]);
            velocity.swap();

            _gl.uniform1i(advProg.uniforms.uVelocity, velocity.first[2]);
            _gl.uniform1i(advProg.uniforms.uSource, density.first[2]);
            _gl.uniform1f(advProg.uniforms.dissipation, config.DENSITY_DISSIPATION);
            blit(density.second[1]);
            density.swap();

            for (let i = 0; i < pointers.length; i++) {
                const p = pointers[i];
                if (p.moved) {
                    splat(p.x, p.y, p.dx, p.dy, p.color);
                    p.moved = false;
                }
            }

            curlProg.bind();
            _gl.uniform2f(curlProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
            _gl.uniform1i(curlProg.uniforms.uVelocity, velocity.first[2]);
            blit(curl[1]);

            vortProg.bind();
            _gl.uniform2f(vortProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
            _gl.uniform1i(vortProg.uniforms.uVelocity, velocity.first[2]);
            _gl.uniform1i(vortProg.uniforms.uCurl, curl[2]);
            _gl.uniform1f(vortProg.uniforms.curl, config.CURL);
            _gl.uniform1f(vortProg.uniforms.dt, dt);
            blit(velocity.second[1]);
            velocity.swap();

            divProg.bind();
            _gl.uniform2f(divProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
            _gl.uniform1i(divProg.uniforms.uVelocity, velocity.first[2]);
            blit(divergence[1]);

            clearProg.bind();
            let pTexId = pressure.first[2];
            _gl.activeTexture(_gl.TEXTURE0 + pTexId);
            _gl.bindTexture(_gl.TEXTURE_2D, pressure.first[0]);
            _gl.uniform1i(clearProg.uniforms.uTexture, pTexId);
            _gl.uniform1f(clearProg.uniforms.value, config.PRESSURE_DISSIPATION);
            blit(pressure.second[1]);
            pressure.swap();

            pressProg.bind();
            _gl.uniform2f(pressProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
            _gl.uniform1i(pressProg.uniforms.uDivergence, divergence[2]);
            pTexId = pressure.first[2];
            _gl.activeTexture(_gl.TEXTURE0 + pTexId);
            for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
                _gl.bindTexture(_gl.TEXTURE_2D, pressure.first[0]);
                _gl.uniform1i(pressProg.uniforms.uPressure, pTexId);
                blit(pressure.second[1]);
                pressure.swap();
            }

            gradProg.bind();
            _gl.uniform2f(gradProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight);
            _gl.uniform1i(gradProg.uniforms.uPressure, pressure.first[2]);
            _gl.uniform1i(gradProg.uniforms.uVelocity, velocity.first[2]);
            blit(velocity.second[1]);
            velocity.swap();

            _gl.viewport(0, 0, _gl.drawingBufferWidth, _gl.drawingBufferHeight);
            displayProg.bind();
            _gl.uniform1i(displayProg.uniforms.uTexture, density.first[2]);
            blit(null);

            animRef.current = requestAnimationFrame(update);
        }

        // --- Mouse / Touch ---
        // Pink color palette only
        const pinkColor = [0.8, 0.2, 0.5];

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            pointers[0].down = true;
            pointers[0].color = pinkColor;
            pointers[0].moved = true;
            pointers[0].dx = (x - pointers[0].x) * 10.0;
            pointers[0].dy = (y - pointers[0].y) * 10.0;
            pointers[0].x = x;
            pointers[0].y = y;
        };

        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touches = e.targetTouches;
            const rect = canvas.getBoundingClientRect();
            for (let i = 0; i < touches.length; i++) {
                if (i >= pointers.length) pointers.push(createPointer());
                const x = touches[i].clientX - rect.left;
                const y = touches[i].clientY - rect.top;
                pointers[i].id = touches[i].identifier;
                pointers[i].down = true;
                pointers[i].color = pinkColor;
                pointers[i].moved = true;
                pointers[i].dx = (x - pointers[i].x) * 10.0;
                pointers[i].dy = (y - pointers[i].y) * 10.0;
                pointers[i].x = x;
                pointers[i].y = y;
            }
        };

        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("touchmove", onTouchMove, { passive: false });

        // Kick off with some initial splats
        splatStack.push(Math.floor(Math.random() * 10) + 5);

        animRef.current = requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(animRef.current);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("touchmove", onTouchMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-auto"
            style={{ opacity: 0.6 }}
        />
    );
}
