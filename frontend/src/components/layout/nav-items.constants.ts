import {
  Home,
  Layers,
  Database,
  Brain,
  Settings,
  CalendarCheck,
  // CalendarDays,
} from "lucide-react";

export const navItems = [
  { key: "home", label: "Home", href: "/dashboard", icon: Home },
  {
    key: "datasets",
    label: "Datasets",
    href: "/dashboard/datasets",
    icon: Layers,
  },
  {
    key: "dataset_versions",
    label: "Dataset Versions",
    href: "/dashboard/dataset-versions",
    icon: Database,
  },
  {
    key: "ml_problems",
    label: "ML Problems",
    href: "/dashboard/ml-problems",
    icon: Brain,
  },
  {
    key: "models",
    label: "Models",
    href: "/dashboard/models",
    icon: Settings,
  },
  {
    key: "predictions",
    label: "Predictions",
    href: "/dashboard/predictions",
    icon: CalendarCheck,
  },
  // {
  //   key: "jobs",
  //   label: "Jobs",
  //   href: "/dashboard/jobs",
  //   icon: CalendarDays,
  // },
];
