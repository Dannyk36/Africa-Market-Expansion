import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { countryScores, regions, regionColors, getScoreColor } from "@/lib/marketData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp, TrendingDown, Globe, Target } from "lucide-react";
import AIChat from "@/components/AIChat";
import { MarketAtlasPanel } from "@/components/MarketAtlasPanel";
import { OnboardingPanel } from "@/components/OnboardingPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CountryIntelligencePanel } from "@/components/CountryIntelligencePanel";
import { TrustCenterPanel } from "@/components/TrustCenterPanel";
import { WatchlistPanel } from "@/components/WatchlistPanel";

type DashboardTab = "start" | "rankings" | "analysis" | "atlas" | "advisor" | "watchlist" | "trust" | "settings";
const WATCHLIST_STORAGE_KEY = "africa-market-watchlist-v1";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("start");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const filteredCountries = useMemo(() => {
    return countryScores.filter((country) => {
      const matchesSearch = country.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRegion = !selectedRegion || country.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchTerm, selectedRegion]);

  const selectedCountryData = useMemo(() => {
    return countryScores.find((c) => c.name === selectedCountry);
  }, [selectedCountry]);

  const topMarkets = countryScores.slice(0, 5);
  const bottomMarkets = countryScores.slice(-5).reverse();

  const radarData = selectedCountryData
    ? [
        { category: "Strengths", value: selectedCountryData.strengths },
        { category: "Opportunities", value: selectedCountryData.opportunities },
        { category: "Weaknesses", value: selectedCountryData.weaknesses },
        { category: "Threats", value: selectedCountryData.threats },
      ]
    : [];

  const handleTabChange = (value: string) => {
    setActiveTab(value as DashboardTab);
  };

  const openCountryIntelligence = (countryName: string) => {
    setSelectedCountry(countryName);
    setActiveTab("analysis");
  };

  const toggleWatchlist = (countryName: string) => {
    setWatchlist(prev =>
      prev.includes(countryName)
        ? prev.filter(item => item !== countryName)
        : [...prev, countryName]
    );
  };

  const removeFromWatchlist = (countryName: string) => {
    setWatchlist(prev => prev.filter(item => item !== countryName));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-bold text-white">
              Africa Market Expansion
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Data-driven heat map evaluating market expansion potential across 54 African countries
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Countries</p>
                <p className="text-3xl font-bold text-white">54</p>
              </div>
              <Globe className="w-8 h-8 text-amber-400 opacity-50" />
            </div>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Top Performer</p>
                <p className="text-2xl font-bold text-white">{topMarkets[0]?.name}</p>
                <p className="text-amber-400 text-sm font-semibold">{topMarkets[0]?.score.toFixed(1)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg. Score</p>
                <p className="text-3xl font-bold text-white">
                  {(countryScores.reduce((sum, c) => sum + c.score, 0) / countryScores.length).toFixed(1)}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Regions Covered</p>
                <p className="text-3xl font-bold text-white">{regions.length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="start">Start Here</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="atlas">Market Atlas</TabsTrigger>
            <TabsTrigger value="advisor">AI Advisor</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="trust">Trust Center</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-6">
            <OnboardingPanel goToTab={setActiveTab} />
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Filters */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Filters</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Search Country</label>
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Region</label>
                      <Select value={selectedRegion || "all"} onValueChange={(val) => setSelectedRegion(val === "all" ? null : val)}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                          <SelectValue placeholder="All Regions" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="all">All Regions</SelectItem>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Top 5 Markets */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Top 5 Markets</h3>
                  <div className="space-y-3">
                    {topMarkets.map((country) => (
                      <button
                        key={country.name}
                        onClick={() => openCountryIntelligence(country.name)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedCountry === country.name
                            ? "bg-amber-500/30 border-2 border-amber-400"
                            : "bg-slate-700/30 hover:bg-slate-700/50 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{country.name}</p>
                            <p className="text-xs text-slate-400">{country.region}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-400">{country.score.toFixed(1)}</p>
                            <p className="text-xs text-slate-400">#{country.rank}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Bottom 5 Markets */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Bottom 5 Markets</h3>
                  <div className="space-y-3">
                    {bottomMarkets.map((country) => (
                      <button
                        key={country.name}
                        onClick={() => openCountryIntelligence(country.name)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedCountry === country.name
                            ? "bg-amber-500/30 border-2 border-amber-400"
                            : "bg-slate-700/30 hover:bg-slate-700/50 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{country.name}</p>
                            <p className="text-xs text-slate-400">{country.region}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-400">{country.score.toFixed(1)}</p>
                            <p className="text-xs text-slate-400">#{country.rank}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Rankings Table */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">All Countries Ranked</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Rank</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Country</th>
                          <th className="text-left py-3 px-4 text-slate-400 font-semibold">Region</th>
                          <th className="text-right py-3 px-4 text-slate-400 font-semibold">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCountries.map((country) => (
                          <tr
                            key={country.name}
                            onClick={() => setSelectedCountry(country.name)}
                            className={`border-b border-slate-700/50 transition-colors cursor-pointer ${
                              selectedCountry === country.name
                                ? "bg-amber-500/20 hover:bg-amber-500/30"
                                : "hover:bg-slate-700/30"
                            }`}
                          >
                            <td className="py-3 px-4 text-slate-300 font-semibold">#{country.rank}</td>
                            <td className="py-3 px-4 text-white font-medium">{country.name}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className="border-slate-600 text-slate-300"
                                style={{
                                  backgroundColor: regionColors[country.region] + "20",
                                  borderColor: regionColors[country.region],
                                  color: regionColors[country.region],
                                }}
                              >
                                {country.region}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div
                                className="inline-block px-3 py-1 rounded-lg font-bold text-white"
                                style={{ backgroundColor: getScoreColor(country.score) }}
                              >
                                {country.score.toFixed(1)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <CountryIntelligencePanel
              country={selectedCountryData ?? null}
              onSelectCountry={openCountryIntelligence}
              isInWatchlist={selectedCountryData ? watchlist.includes(selectedCountryData.name) : false}
              onToggleWatchlist={toggleWatchlist}
            />
          </TabsContent>

          <TabsContent value="atlas" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Regional Comparison</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={regions.map((region) => ({
                    region,
                    avgScore:
                      countryScores
                        .filter((c) => c.region === region)
                        .reduce((sum, c) => sum + c.score, 0) /
                      countryScores.filter((c) => c.region === region).length,
                    count: countryScores.filter((c) => c.region === region).length,
                  }))}
                >
                  <CartesianGrid stroke="#475569" />
                  <XAxis dataKey="region" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#fbbf24" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <MarketAtlasPanel
              selectedCountry={selectedCountry}
              onInspectCountry={openCountryIntelligence}
            />
          </TabsContent>

          <TabsContent value="advisor" className="space-y-6">
            <div className="h-[720px]">
              <AIChat />
            </div>
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-6">
            <WatchlistPanel
              watchlist={watchlist}
              onSelectCountry={openCountryIntelligence}
              onRemoveCountry={removeFromWatchlist}
            />
          </TabsContent>

          <TabsContent value="trust" className="space-y-6">
            <TrustCenterPanel />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
