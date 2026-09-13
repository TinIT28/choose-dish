import { useState } from "react";
import { ChefHat, LogOut, Menu, Settings } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export interface AppHeaderUser {
  email: string;
}

interface AppHeaderProps {
  user: AppHeaderUser | null;
  isAdmin?: boolean;
  onLogout?: () => void | Promise<void>;
}

const navItems = [
  { label: "Hôm nay", to: "/", end: true },
  { label: "Kho món", to: "/dishes" },
  { label: "Lịch sử", to: "/history" },
];

const navLinkClassName =
  "shrink-0 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-secondary-foreground";

function getAvatarFallback(email: string) {
  const localPart = email.split("@")[0].replace(/[^a-zA-ZÀ-ỹ]/g, "");
  return (localPart.slice(0, 2) || "U").toUpperCase();
}

export function AppHeader({ user, isAdmin = false, onLogout }: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between w-full gap-4 px-5 sm:px-8">
        <Link
          className="group flex shrink-0 items-center gap-2.5 font-semibold tracking-[-0.02em]"
          to="/"
        >
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-6">
            <ChefHat className="size-4" aria-hidden="true" />
          </span>
          <span>Choose Dish</span>
        </Link>

        <NavigationMenu
          aria-label="Điều hướng chính"
          className="hidden min-w-0 flex-1 justify-start px-1 md:flex"
        >
          <NavigationMenuList className="justify-start">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.to}>
                <NavigationMenuLink asChild>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={navLinkClassName}
                  >
                    {item.label}
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            {isAdmin && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <NavLink
                    to="/admin"
                    className={navLinkClassName}
                  >
                    Quản trị
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {user ? (
            <>
              <Avatar
                aria-label={`Tài khoản ${user.email}`}
                className="size-9 border border-border bg-secondary"
              >
                <AvatarFallback>{getAvatarFallback(user.email)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-44 truncate px-2 text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Cài đặt"
              >
                <Link to="/settings">
                  <Settings className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              {onLogout && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Đăng xuất"
                  onClick={() => void onLogout()}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                </Button>
              )}
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Đăng nhập</Link>
            </Button>
          )}
        </div>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader className="pr-10">
              <SheetTitle>Choose Dish</SheetTitle>
              <SheetDescription>Điều hướng nhanh đến các khu vực trong ứng dụng.</SheetDescription>
            </SheetHeader>

            <nav aria-label="Điều hướng mobile" className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMobileMenu}
                  className={`${navLinkClassName} w-full px-4 py-3 text-left`}
                >
                  {item.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={closeMobileMenu}
                  className={`${navLinkClassName} w-full px-4 py-3 text-left`}
                >
                  Quản trị
                </NavLink>
              )}
            </nav>

            <div className="mt-auto border-t border-border pt-5">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      aria-label={`Tài khoản ${user.email}`}
                      className="size-10 border border-border bg-secondary"
                    >
                      <AvatarFallback>{getAvatarFallback(user.email)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 truncate text-sm font-medium">{user.email}</span>
                  </div>
                  <Button asChild variant="outline" className="justify-start" onClick={closeMobileMenu}>
                    <Link to="/settings">
                      <Settings className="size-4" aria-hidden="true" />
                      Cài đặt
                    </Link>
                  </Button>
                  {onLogout && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        closeMobileMenu();
                        void onLogout();
                      }}
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Đăng xuất
                    </Button>
                  )}
                </div>
              ) : (
                <Button asChild className="w-full" onClick={closeMobileMenu}>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
