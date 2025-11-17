"use client";

import { MagicCard } from "@/components/ui/magic-card";
import Link from "next/link";

const Cards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 max-w-7xl mx-auto">
      {/* Card 1 */}
      <MagicCard className="p-6 rounded-xl shadow-lg bg-white dark:bg-[#171717]">
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Capacity Tracker</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Innovative energy solutions tailored to meet your specific needs and requirements.
        </p>
        <Link href="/application">
          <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95">
            Launch Application
          </button>
        </Link>
      </MagicCard>

      {/* Card 2 */}
      <MagicCard className="p-6 rounded-xl shadow-lg bg-white dark:bg-[#171717]">
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Sustainability</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Commitment to sustainable practices that protect our environment for future generations.
        </p>
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95">
          Learn More
        </button>
      </MagicCard>

      {/* Card 3 */}
      <MagicCard className="p-6 rounded-xl shadow-lg bg-white dark:bg-[#171717]">
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Innovation</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Cutting-edge technology and research driving the future of energy.
        </p>
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95">
          Learn More
        </button>
      </MagicCard>

      {/* Card 4 */}
      <MagicCard className="p-6 rounded-xl shadow-lg bg-white dark:bg-[#171717]">
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Partnerships</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Strong partnerships that create value and drive success for all stakeholders.
        </p>
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95">
          Learn More
        </button>
      </MagicCard>

      {/* Card 5 */}
      <MagicCard className="p-6 rounded-xl shadow-lg bg-white dark:bg-[#171717]">
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Global Reach</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Worldwide presence with operations across multiple continents and regions.
        </p>
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95">
          Learn More
        </button>
      </MagicCard>

      {/* Card 6 */}
      <MagicCard className="p-6 rounded-xl shadow-lg bg-white dark:bg-[#171717]">
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Community Impact</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Positive impact on communities through education, healthcare, and development programs.
        </p>
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all hover:from-indigo-600 hover:to-purple-600 active:scale-95">
          Learn More
        </button>
      </MagicCard>
    </div>
  );
};

export default Cards;