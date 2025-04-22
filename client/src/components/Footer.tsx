export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Benefits Portal. All rights reserved.
          </div>
          <div className="mt-2 md:mt-0 flex items-center space-x-4">
            <a href="#" className="text-sm text-slate-500 hover:text-primary">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-primary">Terms of Service</a>
            <a href="#" className="text-sm text-slate-500 hover:text-primary">Help</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
