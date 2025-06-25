import {
  InsertDriveFile as DefaultFileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  Equalizer as ExcelIcon,
  Slideshow as PowerPointIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';

/**
 * 根据文件扩展名获取对应的图标组件
 * @param filename 文件名或文件类型
 * @param isFolder 是否为文件夹
 * @returns 对应的图标组件
 */
export const getFileIcon = (filename: string, isFolder: boolean = false, props?: SvgIconProps) => {
  if (isFolder) {
    return <FolderIcon color="primary" {...props} />;
  }

  // 获取文件扩展名
  const extension = filename.toLowerCase().split('.').pop() || '';
  
  // 根据扩展名返回对应图标
  switch (extension) {
    // 图片文件
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return <ImageIcon sx={{ color: '#4DABF5' }} {...props} />;
    
    // PDF文件
    case 'pdf':
      return <PdfIcon sx={{ color: '#F44336' }} {...props} />;
    
    // Word文档
    case 'doc':
    case 'docx':
    case 'rtf':
      return <WordIcon sx={{ color: '#295396' }} {...props} />;
    
    // Excel表格
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <ExcelIcon sx={{ color: '#217346' }} {...props} />;
    
    // PowerPoint演示文稿
    case 'ppt':
    case 'pptx':
      return <PowerPointIcon sx={{ color: '#D24726' }} {...props} />;
    
    // 代码文件
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'java':
    case 'py':
    case 'c':
    case 'cpp':
    case 'php':
    case 'rb':
    case 'go':
    case 'json':
    case 'xml':
      return <CodeIcon sx={{ color: '#4A95AF' }} {...props} />;
    
    // 文本文件
    case 'txt':
    case 'md':
      return <TextIcon sx={{ color: '#607D8B' }} {...props} />;
    
    // 视频文件
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'mkv':
    case 'webm':
      return <VideoIcon sx={{ color: '#F6B93B' }} {...props} />;
    
    // 音频文件
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'm4a':
      return <AudioIcon sx={{ color: '#E87D2B' }} {...props} />;
    
    // 压缩文件
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <ArchiveIcon sx={{ color: '#8D6E63' }} {...props} />;
    
    // 默认文件图标
    default:
      return <DefaultFileIcon color="action" {...props} />;
  }
};

/**
 * 根据文件类型获取对应的颜色
 * @param filename 文件名或文件类型
 * @param isFolder 是否为文件夹
 * @returns 对应的颜色代码
 */
export const getFileColor = (filename: string, isFolder: boolean = false): string => {
  if (isFolder) {
    return '#4A95AF'; // 文件夹使用主题色
  }

  const extension = filename.toLowerCase().split('.').pop() || '';
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return '#4DABF5'; // 蓝色
    
    case 'pdf':
      return '#F44336'; // 红色
    
    case 'doc':
    case 'docx':
    case 'rtf':
      return '#295396'; // 深蓝色
    
    case 'xls':
    case 'xlsx':
    case 'csv':
      return '#217346'; // 绿色
    
    case 'ppt':
    case 'pptx':
      return '#D24726'; // 橙红色
    
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'java':
    case 'py':
    case 'c':
    case 'cpp':
    case 'php':
    case 'rb':
    case 'go':
    case 'json':
    case 'xml':
      return '#4A95AF'; // 与主题色一致
    
    case 'txt':
    case 'md':
      return '#607D8B'; // 灰色
    
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'mkv':
    case 'webm':
      return '#F6B93B'; // 黄色
    
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'm4a':
      return '#E87D2B'; // 橙色
    
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return '#8D6E63'; // 棕色
    
    default:
      return '#9E9E9E'; // 默认灰色
  }
}; 