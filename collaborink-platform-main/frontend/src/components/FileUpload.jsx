import { useRef, useState } from 'react';
import { Upload, X, FileText, Image, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function FilePreview({ file, onRemove }) {
  const isImage = file.type?.startsWith('image/');
  return (
    <div className="flex items-center gap-3 bg-gray-700 rounded-lg px-3 py-2">
      {isImage ? (
        <Image size={16} className="text-blue-400 flex-shrink-0" />
      ) : (
        <FileText size={16} className="text-gray-400 flex-shrink-0" />
      )}
      <span className="text-sm text-white truncate flex-1">{file.name}</span>
      <span className="text-xs text-gray-500 flex-shrink-0">
        {(file.size / 1024).toFixed(0)} KB
      </span>
      {onRemove && (
        <button onClick={onRemove} className="text-gray-500 hover:text-red-400 transition flex-shrink-0">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function FileUpload({ workspaceId, projectId, taskId, onUploaded }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);

  const validate = (fileList) => {
    const valid = [];
    const errs = [];
    for (const f of fileList) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        errs.push(`${f.name}: unsupported file type`);
      } else if (f.size > MAX_SIZE) {
        errs.push(`${f.name}: exceeds 10MB limit`);
      } else {
        valid.push(f);
      }
    }
    return { valid, errs };
  };

  const addFiles = (fileList) => {
    const { valid, errs } = validate(Array.from(fileList));
    setErrors(errs);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...valid.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      // backend requires workspace; fall back to projectId as workspace if not provided
      fd.append('workspace', workspaceId || projectId || '');
      if (projectId) fd.append('project', projectId);
      if (taskId) fd.append('taskId', taskId);
      try {
        const res = await api.post('/files', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push(res.data);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    if (uploaded.length) {
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded`);
      setFiles([]);
      onUploaded?.(uploaded);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30'
        }`}
      >
        <Upload size={24} className="mx-auto text-gray-500 mb-2" />
        <p className="text-sm text-gray-400">
          Drop files here or <span className="text-blue-400">browse</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">PDF, images, docs — up to 10MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={12} />
              {e}
            </div>
          ))}
        </div>
      )}

      {/* Queued files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <FilePreview key={i} file={f} onRemove={() => removeFile(i)} />
          ))}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg font-medium transition"
          >
            {uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
