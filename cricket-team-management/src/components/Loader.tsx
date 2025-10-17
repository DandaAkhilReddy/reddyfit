export default function Loader() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin"></div>
        <div className="mt-4 text-center text-island-blue-600 dark:text-island-blue-400 font-semibold">
          Loading...
        </div>
      </div>
    </div>
  );
}
