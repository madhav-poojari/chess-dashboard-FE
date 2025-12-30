import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  UserCircleIcon,
  DocsIcon,
  GroupIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";

import { fetchStudents } from "../api/user/service";

import { User, UserRole } from "../api/user/dto";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; description?: string }[];
  allowedRoles?: UserRole[];
};

const AppSidebar: React.FC = () => {
  const { user, loading } = useAuth();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [students, setStudents] = useState<{ id: string; name: string; lessonPlan?: string }[]>([]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadStudents = async () => {
      // Normalize role comparison
      const userRole = user?.role?.toLowerCase().trim() || "";

      const permittedRoles = [UserRole.COACH, UserRole.MENTOR_COACH, UserRole.ADMIN];

      if (user && permittedRoles.includes(userRole as UserRole)) {
        try {
          const fetchedStudents = await fetchStudents();

          if (fetchedStudents && Array.isArray(fetchedStudents)) {
            const mappedStudents = fetchedStudents.map((s: User) => ({
              id: s.id,
              name: `${s.first_name} ${s.last_name}`,
              lessonPlan: s.current_lesson_plan || "No active plan"
            }));
            setStudents(mappedStudents);
          } else {
            setStudents([]);
          }
        } catch (err) {
          console.error("Failed to fetch students", err);
          // Set to empty on error
          setStudents([]);
        }
      }
    };

    if (!loading) {
      loadStudents();
    }
  }, [user, loading]);

  // Memoize navItems to depend on students
  const navItems: NavItem[] = [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path: "/",
      allowedRoles: [UserRole.STUDENT, UserRole.COACH, UserRole.MENTOR_COACH, UserRole.ADMIN]
    },
    {
      icon: <UserCircleIcon />,
      name: "User Profile",
      path: "/profile",
      allowedRoles: [UserRole.STUDENT, UserRole.COACH, UserRole.MENTOR_COACH, UserRole.ADMIN]
    },
    {
      icon: <DocsIcon />,
      name: "Notes",
      path: "/not es",

      allowedRoles: [UserRole.STUDENT]
    },
    {
      icon: <GroupIcon />,
      name: "Students",

      allowedRoles: [UserRole.COACH, UserRole.MENTOR_COACH, UserRole.ADMIN],
      subItems: students.map(student => ({
        name: student.name,
        path: `/notes?studentId=${student.id}`,
        description: student.lessonPlan
      }))
    },
  ];

  const isActive = useCallback(
    (path: string) => {
      // Exact match for simple paths
      if (location.pathname === path) return true;

      // Check query params if present in path
      if (path.includes('?')) {
        const [pathBase, query] = path.split('?');
        return location.pathname === pathBase && location.search === `?${query}`;
      }

      return false;
    },
    [location.pathname, location.search]
  );

  // while loading user we can hide role-restricted links
  console.log("AppSidebar State:", { loading, user });
  if (loading) return null;


  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, students]); // Added students dependency

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `main-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === "main" &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: "main", index };
    });
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        if (nav.allowedRoles) {
          const userRole = user?.role?.toLowerCase().trim() || "";
          console.log(`Checking role for ${nav.name}: userRole=${userRole}, allowed=${nav.allowedRoles}`);
          if (!user || !nav.allowedRoles.includes(userRole as UserRole)) {
            return null; // hide this nav item
          }
        }
        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index)}
                className={`menu-item group ${openSubmenu?.type === "main" && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  } cursor-pointer ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${openSubmenu?.type === "main" && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === "main" &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`menu-item-icon-size ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`main-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === "main" && openSubmenu?.index === index
                      ? `${subMenuHeight[`main-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.length === 0 && (
                    <li className="px-4 py-2 text-sm text-gray-500 italic">
                      No students found
                    </li>
                  )}
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          } block`}
                      >
                        <div className="flex flex-col">
                          <span>{subItem.name}</span>
                          {subItem.description && (
                            <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">
                              {subItem.description}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/brs-logo/brs-flat.png"
                alt="Logo"
                width={400}
                height={400}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
