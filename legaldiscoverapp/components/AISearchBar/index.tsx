import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';

export const AISearchBar = () => (
  <div className="flex items-center px-[10px] w-full max-w-[52%] h-[38px] border border-gray-300 rounded-lg focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
    <Search className="h-5 w-5 text-gray-500 flex-shrink-0" />
    <Input
      type="text"
      placeholder="Search cases, documents, clients, or use natural language..."
      className="leading-5 placeholder-gray-500 border-none border-transparent focus:ring-transparent"
    />
    <Button
      className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 m-1 hover:bg-gray-200 h-[30px]"
    >
      AI Search
    </Button>
  </div>
);

