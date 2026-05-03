"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import TiltedImage from "@/components/TiltImage";
import { useThemeContext } from "@/context/ThemeContext";
import { ArrowLeft, ArrowRight, CalendarDays, FileImage, FileText, Loader2 } from "lucide-react";
import Image from "next/image";
import Marquee from "react-fast-marquee";
import Footer from "@/components/Footer";
import { fetchPublishedTenderNotices, getFileUrl, type TenderNotice } from "@/lib/api";

export default function HomePage() {
  const { theme } = useThemeContext();
  const [tenders, setTenders] = useState<TenderNotice[]>([]);
  const [loadingTenders, setLoadingTenders] = useState(true);
  const [activeTenderIndex, setActiveTenderIndex] = useState(0);
  const inventoryModules = [
    "Stock Tracking",
    "Purchase Orders",
    "Warehouse Ops",
    "Supplier Management",
    "Batch & Expiry",
    "Low-Stock Alerts",
  ];

  useEffect(() => {
    const loadTenders = async () => {
      try {
        const notices = await fetchPublishedTenderNotices();
        setTenders(notices.slice(0, 3));
      } catch (error) {
        console.error("Failed to load tender notices:", error);
      } finally {
        setLoadingTenders(false);
      }
    };

    void loadTenders();
  }, []);

  useEffect(() => {
    if (activeTenderIndex >= tenders.length && tenders.length > 0) {
      setActiveTenderIndex(0);
    }
  }, [activeTenderIndex, tenders]);

  const isImageFile = (fileType: string) => fileType.startsWith("image/");

  const formatDeadline = (value: string) =>
    new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(value));

  const activeTender = tenders[activeTenderIndex] || null;

  const showPreviousTender = () => {
    if (tenders.length === 0) return;
    setActiveTenderIndex((current) => (current === 0 ? tenders.length - 1 : current - 1));
  };

  const showNextTender = () => {
    if (tenders.length === 0) return;
    setActiveTenderIndex((current) => (current === tenders.length - 1 ? 0 : current + 1));
  };

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
              src="/assets/developer/rahimul.jpg"
              alt="userImage1"
            />
            <Image
              className="size-7 rounded-full"
              height={50}
              width={50}
              src="/assets/developer/jawad.jpg"
              alt="userImage2"
            />
            <Image
              className="size-7 rounded-full"
              height={50}
              width={50}
              src="/assets/developer/shawon.jpg"
              alt="userImage3"
            />
          </div>
          <p className="text-xs"> + meet with our developers </p>
        </div>
        <h1 className="mt-2 text-5xl/15 md:text-[64px]/19 font-semibold max-w-3xl">
          <span className="bg-linear-to-r from-[#923FEF] dark:from-[#C99DFF] to-[#C35DE8] dark:to-[#E1C9FF] bg-clip-text text-transparent">
            IICT
          </span>
          {" "}Inventory Management System
        </h1>
        <p className="text-base dark:text-slate-300 max-w-lg mt-2">
          A centralized platform to manage stock receiving, storage, transfers,
          and distribution across IICT labs and departments.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <Link href="/auth/login" className="bg-purple-600 hover:bg-purple-700 transition text-white rounded-md px-6 h-11 flex items-center justify-center">
            Sign In
          </Link>
          <Link href="/auth/register" className="flex items-center gap-2 border border-purple-900 transition text-slate-600 dark:text-white rounded-md px-6 h-11 hover:bg-purple-50 dark:hover:bg-purple-900/10">
            <span>Create Account</span>
          </Link>
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
      <section className="mx-auto mt-24 w-full max-w-6xl px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#fffdf7_0%,#f8f4ec_100%)] p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Public notices</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Tender notices</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Latest published tender announcements from IICT. Open the attached PDF or image notice directly.
              </p>
            </div>
          </div>

          {loadingTenders ? (
            <div className="mt-8 flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-slate-600">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading tender notices...
            </div>
          ) : tenders.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
              No published tender notices are available right now.
            </div>
          ) : (
            <div className="mt-8">
              {activeTender ? (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col">
                    <div className="relative">
                      {isImageFile(activeTender.file_type) ? (
                        <div className="relative h-[360px] w-full bg-slate-100 sm:h-[460px] lg:h-[560px]">
                          <Image
                            src={getFileUrl(activeTender.file_path)}
                            alt={activeTender.title}
                            fill
                            className="object-contain bg-slate-100"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-[360px] items-center justify-center bg-[linear-gradient(135deg,#111827_0%,#334155_100%)] text-white sm:h-[460px] lg:h-[560px]">
                          <div className="text-center">
                            <FileText className="mx-auto h-20 w-20" />
                            <p className="mt-5 text-sm uppercase tracking-[0.2em] text-slate-300">PDF Notice Preview</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-6 lg:p-8">
                      <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            <CalendarDays className="h-4 w-4" />
                            Deadline {formatDeadline(activeTender.deadline)}
                          </div>
                          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {activeTenderIndex + 1} / {tenders.length}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-2xl font-semibold text-slate-950">{activeTender.title}</h3>
                          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                            {activeTender.summary || "Official notice published by the administration."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={showPreviousTender}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                              aria-label="Previous tender notice"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={showNextTender}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                              aria-label="Next tender notice"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>

                          <Link
                            href={getFileUrl(activeTender.file_path)}
                            target="_blank"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                          >
                            {isImageFile(activeTender.file_type) ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            Open notice
                          </Link>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {tenders.map((tender, index) => (
                            <button
                              key={tender.id}
                              type="button"
                              onClick={() => setActiveTenderIndex(index)}
                              className={`h-2.5 rounded-full transition ${
                                index === activeTenderIndex
                                  ? "w-10 bg-slate-900"
                                  : "w-2.5 bg-slate-300 hover:bg-slate-400"
                              }`}
                              aria-label={`Show tender notice ${index + 1}`}
                            >
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
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
