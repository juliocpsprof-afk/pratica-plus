import Link from "next/link";

type CourseCardProps = {
  title: string;
  description: string;
  image: string;
  href: string;
  tag: string;
};

export function CourseCard({ title, description, image, href, tag }: CourseCardProps) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden md:h-56">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />

        <span className="absolute left-5 top-5 rounded-full bg-[#f7c600] px-4 py-2 text-xs font-black text-[#08213f]">
          {tag}
        </span>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-black text-[#08213f] md:text-2xl">{title}</h3>

        <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">
          {description}
        </p>

        <Link
          href={href}
          className="mt-5 inline-flex rounded-full bg-[#08213f] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
        >
          Iniciar prática
        </Link>
      </div>
    </article>
  );
}
