import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarItem({ menuItems }: { menuItems: { name: string; href: string }[] }) {
    const pathname = usePathname();

    return (
        <div>
            {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        {item.name}
                    </Link>
                );
            })}
        </div>
    )
}