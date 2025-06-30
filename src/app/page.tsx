import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-shrink-0">
              <Image
                src="/profile_pic.jpeg"
                alt="Jan Kasen"
                width={300}
                height={300}
                className="rounded-full shadow-lg object-cover"
                priority
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Jan Kasen
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
                Computer Science Student at UCLA
              </p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">About Me</h2>
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-lg leading-relaxed mb-6">
              I'm Jan Kasen, a Computer Science student at UCLA graduating in June 2026. 
              I'm also pursuing an Anthropology minor with a keen interest in language and 
              culture and how they shape the way we interact with technology.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              I'm interested in Full Stack Development and Machine Learning. I'm still 
              figuring out which area I want to focus on. I enjoy seeing my vision come 
              to fruition whenever I build something. I'm drawn to both areas because they 
              help me explore and answer questions about how things work.
            </p>
            <p className="text-lg leading-relaxed">
              In my free time I love going through data and analytics of the NBA and 
              professional Counter-Strike 2.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
