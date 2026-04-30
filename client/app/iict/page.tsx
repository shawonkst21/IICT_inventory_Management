"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SectionTitle from "@/components/SectionTitle";
import TiltedImage from "@/components/TiltImage";
import { useThemeContext } from "@/context/ThemeContext";
import { featuresData } from "@/data/featuresData";
import { FaqSection } from "@/sections/FaqSection";
import Pricing from "@/sections/Pricing";
import { VideoIcon } from "lucide-react";
import Image from "next/image";
import Marquee from "react-fast-marquee";
import Footer from "@/components/Footer";

export default function HomePage() {
  const { theme } = useThemeContext();
  const inventoryModules = [
    "Stock Tracking",
    "Purchase Orders",
    "Warehouse Ops",
    "Supplier Management",
    "Batch & Expiry",
    "Low-Stock Alerts",
  ];

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center text-center px-4 bg-[url('/assets/light-hero-gradient.svg')] dark:bg-[url('/assets/dark-hero-gradient.svg')] bg-no-repeat bg-cover">
        <div className="flex flex-wrap items-center justify-center gap-3 p-1.5 pr-4 mt-46 rounded-full border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-600/20">
          <div className="flex items-center -space-x-3">
            <Image
              className="size-7 rounded-full"
              height={50}
              width={50}
              src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=50"
              alt="userImage1"
            />
            <Image
              className="size-7 rounded-full"
              height={50}
              width={50}
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50"
              alt="userImage2"
            />
            <Image
              className="size-7 rounded-full"
              height={50}
              width={50}
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=50&h=50&auto=format&fit=crop"
              alt="userImage3"
            />
          </div>
          <p className="text-xs">Join community of 1m+ founders </p>
        </div>
        <h1 className="mt-2 text-5xl/15 md:text-[64px]/19 font-semibold max-w-3xl">
          <span className="bg-gradient-to-r from-[#923FEF] dark:from-[#C99DFF] to-[#C35DE8] dark:to-[#E1C9FF] bg-clip-text text-transparent">
            IICT
          </span>
          {" "}Inventory Management System
        </h1>
        <p className="text-base dark:text-slate-300 max-w-lg mt-2">
          A centralized platform to manage stock receiving, storage, transfers,
          and distribution across IICT labs and departments.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <Link href="/inventory_manager" className="bg-purple-600 hover:bg-purple-700 transition text-white rounded-md px-6 h-11 flex items-center justify-center">
            Get started
          </Link>
          <button className="flex items-center gap-2 border border-purple-900 transition text-slate-600 dark:text-white rounded-md px-6 h-11">
            <VideoIcon strokeWidth={1} />
            <span>Watch demo</span>
          </button>
        </div>
        <h3 className="text-base text-center text-slate-400 mt-28 pb-14 font-medium">
          Core inventory operations covered —
        </h3>
        <Marquee
          className="max-w-5xl mx-auto"
          gradient={true}
          speed={25}
          gradientColor={theme === "dark" ? "#000" : "#fff"}
        >
          <div className="flex items-center justify-center gap-4 px-2">
            {[...inventoryModules, ...inventoryModules].map((module, index) => (
              <div
                key={index}
                className="mx-2 rounded-full border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                {module}
              </div>
            ))}
          </div>
        </Marquee>
      </div>
      <TiltedImage />
      {/* <SectionTitle
        text1="FEATURES"
        text2="Built for builders"
        text3="Components, patterns and pages — everything you need to ship."
      />

      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-4 mt-10 px-6 md:px-16 lg:px-24 xl:px-32">
        {featuresData.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/20 max-w-80 md:max-w-66"
          >
            <feature.icon
              className="text-purple-500 size-8 mt-4"
              strokeWidth={1.3}
            />
            <h3 className="text-base font-medium">{feature.title}</h3>
            <p className="text-slate-400 line-clamp-2">{feature.description}</p>
          </div>
        ))}
      </div>

      <Pricing />

      <FaqSection />

      <div className="flex flex-col items-center text-center justify-center mt-20">
        <h3 className="text-3xl font-semibold mt-16 mb-4">
          Ready to Get Started?
        </h3>
        <p className="text-slate-600 dark:text-slate-200 max-w-xl mx-auto">
          Join thousands of satisfied customers and transform your business
          today.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <button className="bg-purple-600 hover:bg-purple-700 transition text-white rounded-md px-6 h-11">
            Start free trial
          </button>
          <button className="border border-purple-900 transition text-slate-600 dark:text-white rounded-md px-6 h-11">
            Contact sales
          </button>
        </div>
      </div> */}
      <Footer/>
    </>
  );
}
