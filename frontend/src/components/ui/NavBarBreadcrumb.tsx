import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

type Props = {
  menu: Array<{
    label: string;
    href: string;
  }>;
  lastEntry: string;
};

const NavBarBreadcrumb = ({ menu, lastEntry }: Props) => {
  return (
    <Breadcrumb className="pb-4">
      <BreadcrumbList>
        {menu.map((item) => (
          <BreadcrumbItem key={item.href}>
            <BreadcrumbLink href={item.href} className="capitalize">
              {item.label}
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </BreadcrumbItem>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage className="capitalize">{lastEntry}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default NavBarBreadcrumb;
