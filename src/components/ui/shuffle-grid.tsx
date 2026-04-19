"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export const ShuffleHero = () => {
  return (
    <section className="w-full px-4 md:px-8 py-12 md:py-24 grid grid-cols-1 md:grid-cols-2 items-center gap-8 max-w-6xl mx-auto">
      <div>
        <span className="block mb-4 text-xs md:text-sm text-primary font-medium tracking-wide uppercase">
          Crafted with care
        </span>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
          A portfolio of work I'm proud of
        </h1>
        <p className="text-base md:text-lg text-muted-foreground my-4 md:my-6 max-w-prose">
          Explore selected projects, leave your thoughts, and reach out if you'd like to collaborate. Built to evolve —
          more is on the way.
        </p>
        <Button size="lg" asChild>
          <a href="#projects">View projects</a>
        </Button>
      </div>
      <ShuffleGrid />
    </section>
  );
};

const shuffle = (array: typeof squareData) => {
  let currentIndex = array.length;
  let randomIndex: number;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const squareData = [
  { id: 1, src: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=600&q=80" },
  { id: 2, src: "https://images.unsplash.com/photo-1510925758641-869d353cecc7?auto=format&fit=crop&w=600&q=80" },
  { id: 3, src: "https://images.unsplash.com/photo-1629901925121-8a141c2a42f4?auto=format&fit=crop&w=600&q=80" },
  { id: 4, src: "https://images.unsplash.com/photo-1580238053495-b9720401fd45?auto=format&fit=crop&w=600&q=80" },
  { id: 5, src: "https://images.unsplash.com/photo-1569074187119-c87815b476da?auto=format&fit=crop&w=600&q=80" },
  { id: 6, src: "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=600&q=80" },
  { id: 7, src: "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=600&q=80" },
  { id: 8, src: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=600&q=80" },
  { id: 9, src: "https://images.unsplash.com/photo-1610768764270-790fbec18178?auto=format&fit=crop&w=600&q=80" },
  { id: 10, src: "https://images.unsplash.com/photo-1507034589631-9433cc6bc453?auto=format&fit=crop&w=600&q=80" },
  { id: 11, src: "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?auto=format&fit=crop&w=600&q=80" },
  { id: 12, src: "https://images.unsplash.com/photo-1560089000-7433a4ebbd64?auto=format&fit=crop&w=600&q=80" },
  { id: 13, src: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=600&q=80" },
  { id: 14, src: "https://images.unsplash.com/photo-1606244864456-8bee63fce472?auto=format&fit=crop&w=600&q=80" },
  { id: 15, src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80" },
  { id: 16, src: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=600&q=80" },
];

const generateSquares = () =>
  shuffle([...squareData]).map((sq) => (
    <motion.div
      key={sq.id}
      layout
      transition={{ duration: 4.5, type: "ease-in-out" }}
      className="w-full h-full"
      style={{
        backgroundImage: `url(${sq.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  ));

const ShuffleGrid = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [squares, setSquares] = useState(generateSquares());

  useEffect(() => {
    const shuffleSquares = () => {
      setSquares(generateSquares());
      timeoutRef.current = setTimeout(shuffleSquares, 3000);
    };
    shuffleSquares();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-4 grid-rows-4 h-[450px] gap-1 rounded-lg overflow-hidden">
      {squares.map((sq) => sq)}
    </div>
  );
};
