import {
  Building2, CloudRain, CloudRainWind, Construction, Droplets, Footprints, Lightbulb, PawPrint, Trash2, TreePine, Waves, Wind,
  type LucideIcon,
} from 'lucide-react'

// خريطة أسماء الأيقونات المخزنة مع أنواع المشاكل → مكوّن الأيقونة
export const iconMap: Record<string, LucideIcon> = {
  Construction, Trash2, Lightbulb, Droplets, Waves, CloudRain, TreePine, Footprints, Building2, PawPrint, CloudRainWind, Wind,
}

export const getIcon = (name: string): LucideIcon => iconMap[name] ?? Construction
