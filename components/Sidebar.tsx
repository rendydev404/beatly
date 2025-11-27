// components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListMusic, Search } from 'lucide-react';

const routes = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'search', icon: Search, href: '/search' },
  { label: 'Playlist', icon: ListMusic, href: '/playlist' },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <>
      {/* Bottom Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 h-16 md:hidden z-30" data-sidebar>
        <nav className="flex justify-around items-center h-full">
          {routes.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition ${pathname === item.href ? 'text-white' : 'text-zinc-400'}`}
            >
              <item.icon size={24} />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Sidebar for Desktop */}
      <div className="fixed hidden md:flex flex-col z-3 gap-y-2 bg-black h-full w-[250px] p-2" data-sidebar>
        <div className="bg-zinc-900 rounded-lg p-4 h-full">
          <nav className="flex flex-col gap-y-4">
            {routes.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-x-4 text-base font-medium cursor-pointer hover:text-white transition p-2 rounded-md ${pathname === item.href ? 'text-white bg-zinc-800' : 'text-zinc-400'}`}
              >
                <item.icon size={24} />
                <p>{item.label}</p>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;