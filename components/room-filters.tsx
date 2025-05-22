"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface RoomFiltersProps {
  locations: string[];
  features: string[];
  onFilterChange: (filters: RoomFilters) => void;
}

export interface RoomFilters {
  location?: string;
  minCapacity: number;
  features: string[];
  onlyAvailable: boolean;
}

export function RoomFilters({
  locations,
  features,
  onFilterChange,
}: RoomFiltersProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<RoomFilters>({
    location: undefined,
    minCapacity: 0,
    features: [],
    onlyAvailable: false,
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleLocationChange = (location: string) => {
    const newFilters = {
      ...filters,
      location: location === filters.location ? undefined : location,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  const handleCapacityChange = (value: number[]) => {
    const newFilters = { ...filters, minCapacity: value[0] };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter((f) => f !== feature)
      : [...filters.features, feature];

    const newFilters = { ...filters, features: newFeatures };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  const handleAvailabilityToggle = (checked: boolean) => {
    const newFilters = { ...filters, onlyAvailable: checked };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  const updateActiveFiltersCount = (newFilters: RoomFilters) => {
    let count = 0;
    if (newFilters.location) count++;
    if (newFilters.minCapacity > 0) count++;
    if (newFilters.features.length > 0) count++;
    if (newFilters.onlyAvailable) count++;
    setActiveFiltersCount(count);
  };

  const resetFilters = () => {
    const newFilters = {
      location: undefined,
      minCapacity: 0,
      features: [],
      onlyAvailable: false,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setActiveFiltersCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Filtrer les salles</h4>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>

        <div className="space-y-4">
          {/* Filtre par emplacement */}
          <div className="space-y-2">
            <Label>Emplacement</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {filters.location || "Tous les emplacements"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un emplacement..." />
                  <CommandList>
                    <CommandEmpty>Aucun emplacement trouvé.</CommandEmpty>
                    <CommandGroup>
                      {locations.map((location) => (
                        <CommandItem
                          key={location}
                          value={location}
                          onSelect={() => handleLocationChange(location)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.location === location
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {location}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Filtre par capacité */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Capacité minimale</Label>
              <span className="text-sm">{filters.minCapacity} personnes</span>
            </div>
            <Slider
              defaultValue={[0]}
              max={30}
              step={1}
              value={[filters.minCapacity]}
              onValueChange={handleCapacityChange}
            />
          </div>

          <Separator />

          {/* Filtre par équipements */}
          <div className="space-y-2">
            <Label>Équipements</Label>
            <div className="flex flex-wrap gap-2">
              {features.map((feature) => (
                <Badge
                  key={feature}
                  variant={
                    filters.features.includes(feature) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => handleFeatureToggle(feature)}
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Filtre par disponibilité */}
          <div className="flex items-center justify-between">
            <Label htmlFor="available-only">
              Salles disponibles uniquement
            </Label>
            <Switch
              id="available-only"
              checked={filters.onlyAvailable}
              onCheckedChange={handleAvailabilityToggle}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
