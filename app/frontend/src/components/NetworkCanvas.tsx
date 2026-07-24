import React, { useEffect, useRef } from 'react';

const NetworkCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        class Particle {
            x: number; y: number; vx: number; vy: number;
            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
            }
            update(w: number, h: number) {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;
            }
            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#22d3ee55';
                ctx.fill();
            }
        }

        const init = () => {
            canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
            particles = [];
            for (let i = 0; i < 80; i++) particles.push(new Particle(canvas.width, canvas.height));
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.update(canvas.width, canvas.height);
                p.draw();
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(34, 211, 238, ${0.15 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        const handleResize = () => init();
        window.addEventListener('resize', handleResize);

        return () => {
            // Systematic Removal (Garbage Collection)
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} id="auth-canvas" />;
};

export default NetworkCanvas;
