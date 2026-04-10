import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapView } from "@/components/Map";
import { countryScores, getScoreColor, regions, type CountryScore } from "@/lib/marketData";

type AtlasMetric = "score" | "gdpGrowth" | "businessReady" | "idi" | "corruption" | "debtToGdp";

type MarketAtlasPanelProps = {
  selectedCountry: string | null;
  onInspectCountry: (country: string) => void;
};

function getMetricValue(country: CountryScore, metric: AtlasMetric) {
  return country[metric];
}

function getMetricLabel(metric: AtlasMetric) {
  switch (metric) {
    case "score":
      return "Expansion Score";
    case "gdpGrowth":
      return "GDP Growth";
    case "businessReady":
      return "Business Readiness";
    case "idi":
      return "Digital Readiness";
    case "corruption":
      return "Governance / Anti-Corruption";
    case "debtToGdp":
      return "Debt To GDP";
  }
}

function getMetricColor(country: CountryScore, metric: AtlasMetric) {
  if (metric === "score") return getScoreColor(country.score);
  if (metric === "debtToGdp") {
    const value = country.debtToGdp;
    if (value <= 35) return "#16a34a";
    if (value <= 60) return "#84cc16";
    if (value <= 85) return "#eab308";
    if (value <= 120) return "#f97316";
    return "#ef4444";
  }

  const value = getMetricValue(country, metric);
  if (value >= 75) return "#16a34a";
  if (value >= 55) return "#84cc16";
  if (value >= 40) return "#eab308";
  if (value >= 25) return "#f97316";
  return "#ef4444";
}

function formatMetric(country: CountryScore, metric: AtlasMetric) {
  const value = getMetricValue(country, metric);
  if (metric === "gdpGrowth" || metric === "debtToGdp") return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

export function MarketAtlasPanel({ selectedCountry, onInspectCountry }: MarketAtlasPanelProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [metric, setMetric] = useState<AtlasMetric>("score");
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.Circle[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const geocodeCache = useRef<Record<string, google.maps.LatLngLiteral>>({});

  const hasMapConfig = Boolean(import.meta.env.VITE_FRONTEND_FORGE_API_KEY);

  const visibleCountries = useMemo(() => {
    const items =
      selectedRegion === "all"
        ? countryScores
        : countryScores.filter(country => country.region === selectedRegion);

    return items.slice().sort((a, b) => {
      const aValue = getMetricValue(a, metric);
      const bValue = getMetricValue(b, metric);
      if (metric === "debtToGdp") return aValue - bValue;
      return bValue - aValue;
    });
  }, [metric, selectedRegion]);

  const topVisible = visibleCountries.slice(0, 12);

  useEffect(() => {
    return () => {
      overlaysRef.current.forEach(overlay => {
        overlay.setMap(null);
      });
      overlaysRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !hasMapConfig) return;
    void renderMapOverlays(mapRef.current);
  }, [hasMapConfig, metric, selectedCountry, selectedRegion, visibleCountries]);

  const renderMapOverlays = async (map: google.maps.Map) => {
    overlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    overlaysRef.current = [];

    const geocoder = new window.google.maps.Geocoder();
    const infoWindow = infoWindowRef.current || new window.google.maps.InfoWindow();
    infoWindowRef.current = infoWindow;
    const bounds = new window.google.maps.LatLngBounds();

    for (const country of visibleCountries) {
      let position: google.maps.LatLngLiteral | null | undefined = geocodeCache.current[country.name];

      if (!position) {
        position = await new Promise<google.maps.LatLngLiteral | null>(resolve => {
          geocoder.geocode({ address: country.name }, (results, status) => {
            if (status === "OK" && results?.[0]?.geometry.location) {
              const loc = results[0].geometry.location;
              resolve({ lat: loc.lat(), lng: loc.lng() });
            } else {
              resolve(null);
            }
          });
        });

        if (position) {
          geocodeCache.current[country.name] = position;
        }
      }

      if (!position) continue;

      bounds.extend(position);

      const circle = new window.google.maps.Circle({
        map,
        center: position,
        radius: 120000 + (Math.max(country.score, 10) / 100) * 240000,
        strokeColor: getMetricColor(country, metric),
        strokeOpacity: 0.9,
        strokeWeight: selectedCountry === country.name ? 3 : 1.5,
        fillColor: getMetricColor(country, metric),
        fillOpacity: 0.35,
      });

      circle.addListener("click", () => {
        infoWindow.setContent(
          `<div style="min-width:180px">
            <strong>${country.name}</strong><br/>
            ${getMetricLabel(metric)}: ${formatMetric(country, metric)}<br/>
            Rank: #${country.rank}<br/>
            Region: ${country.region}
          </div>`
        );
        infoWindow.setPosition(position);
        infoWindow.open(map);
        onInspectCountry(country.name);
      });

      overlaysRef.current.push(circle);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 40);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Market Atlas</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Explore African markets visually. The map uses color intensity to show where conditions are stronger or weaker based on the metric you choose.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Metric</label>
              <Select value={metric} onValueChange={value => setMetric(value as AtlasMetric)}>
                <SelectTrigger className="w-full border-slate-600 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Expansion Score</SelectItem>
                  <SelectItem value="gdpGrowth">GDP Growth</SelectItem>
                  <SelectItem value="businessReady">Business Readiness</SelectItem>
                  <SelectItem value="idi">Digital Readiness</SelectItem>
                  <SelectItem value="corruption">Governance / Anti-Corruption</SelectItem>
                  <SelectItem value="debtToGdp">Debt To GDP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Region</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full border-slate-600 bg-slate-900 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-700 bg-slate-800/50 p-3">
          {hasMapConfig ? (
            <MapView
              className="h-[560px] rounded-xl"
              initialCenter={{ lat: 1.5, lng: 20 }}
              initialZoom={3}
              onMapReady={map => {
                mapRef.current = map;
                setMapReady(true);
                void renderMapOverlays(map);
              }}
            />
          ) : (
            <div className="flex h-[560px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
              <div className="max-w-md space-y-3">
                <h4 className="text-lg font-semibold text-white">Map Service Not Configured</h4>
                <p className="text-sm leading-6 text-slate-400">
                  The visual atlas can render a live map when frontend map credentials are configured. Until then, use the ranked heat view on the right to compare markets.
                </p>
              </div>
            </div>
          )}
          {hasMapConfig && mapReady ? (
            <p className="px-3 pb-2 pt-3 text-xs text-slate-500">
              Tip: click a circle to inspect a country and sync it with the analysis view.
            </p>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-700 bg-slate-800/50 p-6">
            <h4 className="text-lg font-semibold text-white">Heat View</h4>
            <p className="mt-2 text-sm text-slate-400">
              Top visible countries by {getMetricLabel(metric).toLowerCase()}.
            </p>
            <div className="mt-4 space-y-3">
              {topVisible.map(country => (
                <button
                  key={country.name}
                  type="button"
                  onClick={() => onInspectCountry(country.name)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedCountry === country.name
                      ? "border-amber-400 bg-amber-500/10"
                      : "border-slate-700 bg-slate-900/60 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{country.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{country.region}</p>
                    </div>
                    <Badge
                      className="text-white"
                      style={{ backgroundColor: getMetricColor(country, metric) }}
                    >
                      {formatMetric(country, metric)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 p-6">
            <h4 className="text-lg font-semibold text-white">How To Read This</h4>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              <p>
                Green means stronger conditions for the selected metric. Orange and red indicate weaker conditions or higher caution.
              </p>
              <p>
                `Debt To GDP` is inverted. Lower debt burden is treated as stronger.
              </p>
              <p>
                Use this atlas to spot patterns quickly, then open the analysis view for the country-level details.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
