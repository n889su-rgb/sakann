"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, Check } from "lucide-react";
import { CITIES, DEFAULT_AMENITIES } from "@/lib/constants";

interface SearchAndFilterProps {
  onFilterChange: (filters: {
    search: string;
    city: string;
    currency: string;
    maxPrice: number;
    bedrooms: number;
    amenities: string[];
  }) => void;
}

export function SearchAndFilter({ onFilterChange }: SearchAndFilterProps) {
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [bedrooms, setBedrooms] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const handleApply = () => {
    onFilterChange({
      search,
      city,
      currency,
      maxPrice,
      bedrooms,
      amenities: selectedAmenities,
    });
    setIsFilterOpen(false);
  };

  const handleReset = () => {
    setCity("");
    setCurrency("");
    setMaxPrice(0);
    setBedrooms(0);
    setSelectedAmenities([]);
    onFilterChange({
      search,
      city: "",
      currency: "",
      maxPrice: 0,
      bedrooms: 0,
      amenities: [],
    });
    setIsFilterOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      search,
      city,
      currency,
      maxPrice,
      bedrooms,
      amenities: selectedAmenities,
    });
  };

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  return (
    <div className="w-full">
      {/* Top Search Bar (Matches UI in Screenshot 1) */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالمدينة، الحي، أو اسم المنطقة (مثال: الرياض، المهندسين، بورتسودان...)"
            className="w-full bg-white border border-slate-200 py-3.5 pr-11 pl-4 rounded-2xl text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent transition placeholder:text-slate-400 placeholder:text-xs sm:placeholder:text-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                onFilterChange({ search: "", city, currency, maxPrice, bedrooms, amenities: selectedAmenities });
              }}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm transition shrink-0 ${
            isFilterOpen || city || currency || maxPrice > 0 || bedrooms > 0 || selectedAmenities.length > 0
              ? "bg-brand-800 text-white border-brand-800"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
          title="تصفية متقدمة"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </form>

      {/* Advanced Filter Drawer / Card (Matches Screenshot 4) */}
      {isFilterOpen && (
        <div className="mt-3 p-5 bg-white border border-slate-200 rounded-3xl shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h4 className="font-bold text-slate-900 text-sm">خيارات التصفية والبحث المتقدم</h4>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Currency Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">العملة المفضلة</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency("")}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    currency === "" ? "bg-brand-800 text-white border-brand-800" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("SDG")}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    currency === "SDG" ? "bg-brand-800 text-white border-brand-800" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  جنيه سوداني
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    currency === "USD" ? "bg-brand-800 text-white border-brand-800" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  دولار أمريكي
                </button>
              </div>
            </div>

            {/* City Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">المدينة</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-700"
              >
                <option value="">كل المدن</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Slider (Matching Screenshot 4) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">أقصى سعر شهري</label>
                <span className="text-xs font-bold text-brand-800">
                  {maxPrice > 0 ? `${maxPrice.toLocaleString()} ${currency || "عملة"}` : "بدون حد"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={currency === "USD" ? "2500" : "5000000"}
                step={currency === "USD" ? "50" : "50000"}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-800 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                ملاحظة: قد تختلف عملة كل عقار (جنيه سوداني أو دولار) حسب اختيار مالكه.
              </p>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">أقل عدد غرف</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBedrooms(num)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      bedrooms === num ? "bg-brand-800 text-white border-brand-800" : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    {num === 0 ? "الكل" : `${num}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">المرافق المطلوبة</label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_AMENITIES.map((am) => {
                  const isSelected = selectedAmenities.includes(am.name);
                  return (
                    <button
                      key={am.name}
                      type="button"
                      onClick={() => toggleAmenity(am.name)}
                      className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1 transition ${
                        isSelected
                          ? "bg-brand-800 text-white border-brand-800 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      {am.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apply & Reset Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-2.5 bg-brand-800 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                تطبيق الفلاتر
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
              >
                إعادة ضبط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
