import { motion } from "framer-motion";
import coolGuyImg from "../assets/Cool guy.jpg";

export function GuySection() {
    return (
        <section className="h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-pink-900/10 blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-1/2 h-full bg-purple-900/10 blur-[120px]" />

            {/* Image Center */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 flex justify-center items-center"
            >
                <div className="relative w-[250px] h-[444px] md:w-[300px] md:h-[533px] overflow-hidden hover:scale-105 transition-transform duration-700 shadow-2xl border border-white/10">
                    <img
                        src={coolGuyImg}
                        alt="The Guy"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white font-mono text-xs text-center">CLICK ME -10000 RIZZ</p>
                    </div>
                </div>
            </motion.div>

            {/* "I'm a" — far left edge, 24px from side */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute bottom-8 z-20 text-left"
                style={{ left: "24px" }}
            >
                <h2 className="text-4xl md:text-6xl font-unifraktur text-white">
                    I'm a
                </h2>
            </motion.div>

            {/* "GOOFY GUY" — far right edge, 24px from side */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute bottom-8 z-20 text-right"
                style={{ right: "24px" }}
            >
                <h2 className="text-4xl md:text-6xl font-unifraktur text-white">
                    GOOFY GUY
                </h2>
            </motion.div>
        </section>
    );
}
