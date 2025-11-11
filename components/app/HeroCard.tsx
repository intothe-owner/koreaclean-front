import { Button } from "../ui/button"

const HeroCard = ({ title, content }: { title: string, content: string }) => {
  return (
    <main className="relative z-10 px-8 py-32 max-w-7xl mx-auto flex flex-col items-start  h-[80vh] md:h-[70vh]">
      <div className="max-w-xl space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg">
      {/* <div className="max-w-xl space-y-6  p-8"> */}
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-snug">
          {title}
        </h1>
        <p className="text-lg text-gray-600">
          {content}
        </p>
        <Button className="rounded border border-gray-400 bg-white text-black hover:bg-gray-100">
            앱 다운로드
          </Button>
      </div>
    </main>
  )
}

export default HeroCard;