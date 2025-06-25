import React from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register FilePond plugins
registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

interface FileUploaderProps {
  onFilesUploaded?: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesUploaded }) => {
  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <FilePond
        allowMultiple={true}
        maxFiles={10}
        server={{
          process: async (_fieldName, file, _metadata, load, error) => {
            try {
              const formData = new FormData();
              formData.append('file', file);

              const response = await fetch('/api/files', {
                method: 'POST',
                headers: {
                  'Authorization': `${localStorage.getItem('token')}`
                },
                body: formData,
              });

              // 无论状态码如何，都尝试读取响应体
              const data = await response.json();
              
              if (data.code === 200) {
                load(data.data);
                if (onFilesUploaded) {
                  onFilesUploaded([file as unknown as File]);
                }
              } else {
                // 始终使用后端返回的message字段
                error(data.message || '上传失败');
              }
            } catch (err) {
              // 处理网络错误
              error('上传失败，请检查网络连接');
            }
          },
          revert: null,
          load: null,
          fetch: null,
        }}
        name="file"
        labelIdle='拖放文件或点击 <span class="filepond--label-action">浏览</span>'
        acceptedFileTypes={['application/zip', 'image/*', 'application/pdf']}
        stylePanelLayout="integrated"
        imagePreviewHeight={170}
        styleItemPanelAspectRatio="0.5"
        className="file-uploader"
      />
      
      <style>{`
        .file-uploader {
          --filepond-family-default: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
        }
        :root {
          --filepond--color-root: #1a73e8;
          --filepond--panel-bg: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default FileUploader; 