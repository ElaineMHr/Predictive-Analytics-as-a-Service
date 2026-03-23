import { useTheme } from "./theme.constants";
import { ThemeSwitch } from "../ui/theme-switch";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <ThemeSwitch
      checked={isLight}
      onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
    />
  );
};

export default ThemeToggle;
