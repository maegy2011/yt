import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import CodeBlock from '@tiptap/extension-code-block';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
// import TextStyle from '@tiptap/extension-text-style';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon,
  Code,
  Highlighter,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading as HeadingIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Table as TableIcon,
  Image as ImageIcon,
  Minus,
  Plus
} from 'lucide-react';
import { Button } from './button';
import { Separator } from './separator';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Label } from './label';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "اكتب ملاحظاتك هنا...",
  editable = true,
  className = "" 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlock,
      Underline,
      Strike,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      // TextStyle,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable,
  });

  if (!editor) return null;

  const MenuBar = () => {
    if (!editable) return null;

    const addImage = () => {
      const url = prompt('أدخل رابط الصورة:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    };

    const insertTable = () => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const setColor = (color: string) => {
      editor.chain().focus().setColor(color).run();
    };

    return (
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 rounded-t-lg">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 p-1 bg-white rounded border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            title="عريض"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            title="مائل"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-gray-200' : ''}
            title="تحت الخط"
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-gray-200' : ''}
            title="يتوسطه خط"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Headings */}
        <div className="flex items-center gap-1 p-1 bg-white rounded border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
            title="عنوان رئيسي"
          >
            H1
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
            title="عنوان فرعي"
          >
            H2
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
            title="عنوان ثانوي"
          >
            H3
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Lists */}
        <div className="flex items-center gap-1 p-1 bg-white rounded border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            title="قائمة نقطية"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
            title="قائمة مرقمة"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Special Elements */}
        <div className="flex items-center gap-1 p-1 bg-white rounded border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'bg-gray-200' : ''}
            title="كود"
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
            title="اقتباس"
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-gray-200' : ''}
            title="كتلة كود"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Color and Highlight */}
        <div className="flex items-center gap-1 p-1 bg-white rounded border">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="لون النص">
                <Palette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-4 gap-2">
                {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'].map((color) => (
                  <Button
                    key={color}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0"
                    style={{ backgroundColor: color }}
                    onClick={() => setColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive('highlight') ? 'bg-gray-200' : ''}
            title="تظليل"
          >
            <Highlighter className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Insert Elements */}
        <div className="flex items-center gap-1 p-1 bg-white rounded border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt('أدخل الرابط:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={editor.isActive('link') ? 'bg-gray-200' : ''}
            title="إضافة رابط"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addImage}
            title="إضافة صورة"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertTable}
            title="إضافة جدول"
          >
            <TableIcon className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Text Alignment */}
        <div className="flex items-center gap-1 p-1 bg-white rounded border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
            title="محاذاة لليسار"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
            title="محاذاة للوسط"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
            title="محاذاة لليمين"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* History */}
        <div className="flex items-center gap-1 p-1 bg-white rounded border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="تراجع"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="إعادة"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <MenuBar />
      <EditorContent 
        editor={editor} 
        className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 prose prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_code]:bg-gray-100 [&_code]:p-1 [&_code]:rounded [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic"
      />
    </div>
  );
}
