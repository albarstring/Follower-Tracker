import React, { useRef, useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UploadCloud, FileJson, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { parseInstagramData } from '../utils/parser';

export default function UploadData() {
  const { setFollowersData, setFollowingData, followers, following, clearData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const parsedUsers = parseInstagramData(json);
        
        if (parsedUsers.length === 0) {
          setErrorMsg(`Peringatan: File ${file.name} terbaca kosong atau format tidak dikenali. Jika ini following.json, mungkin bentuknya berbeda.`);
          // Instagram has updated "following" format often, specifically nested inside a "relationships_following" key
        }

        const fileName = file.name.toLowerCase();
        if (fileName.includes('follower')) {
          setFollowersData(parsedUsers);
        } else if (fileName.includes('following')) {
          setFollowingData(parsedUsers);
        } else {
          setErrorMsg(`Tolong pastikan nama file mengandung kata "followers" atau "following" agar sistem bisa membedakan.`);
        }
      } catch (err) {
        setErrorMsg(`Gagal membaca ${file.name}. Pastikan file ini format JSON yang valid.`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Upload Instagram Data</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Upload file followers.json & following.json untuk dianalisa.</p>
        </div>
        {(followers.length > 0 || following.length > 0) && (
          <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={clearData}>
            <Trash2 className="w-4 h-4 mr-2" /> Hapus Data
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <Card 
        className={`border-dashed border-2 transition-colors ${dragActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'bg-gray-50/50 dark:bg-gray-900/20'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Drag & drop your JSON files here</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
            Upload the <span className="font-mono text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">followers_1.json</span> and <span className="font-mono text-xs bg-gray-200 dark:bg-gray-800 px-1 rounded">following.json</span> files.
          </p>
          
          <input 
            type="file" 
            multiple 
            accept=".json,application/json" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleChange}
          />
          <Button size="lg" className="rounded-full shadow-md" onClick={() => fileInputRef.current?.click()}>
            Browse Files
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className={`transition-colors ${followers.length > 0 ? 'bg-green-50/50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20' : 'bg-white dark:bg-gray-950'}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${followers.length > 0 ? 'bg-green-100 text-green-600 dark:bg-green-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
              {followers.length > 0 ? <CheckCircle2 className="w-6 h-6" /> : <FileJson className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">followers_1.json</p>
              <p className="text-xs text-gray-500">
                {followers.length > 0 ? <span className="text-green-600 dark:text-green-400 font-medium">Berhasil ({followers.length} user)</span> : 'Pending upload...'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`transition-colors ${following.length > 0 ? 'bg-green-50/50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20' : 'bg-white dark:bg-gray-950'}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${following.length > 0 ? 'bg-green-100 text-green-600 dark:bg-green-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
              {following.length > 0 ? <CheckCircle2 className="w-6 h-6" /> : <FileJson className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">following.json</p>
              <p className="text-xs text-gray-500">
                {following.length > 0 ? <span className="text-green-600 dark:text-green-400 font-medium">Berhasil ({following.length} user)</span> : 'Pending upload...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-800 dark:text-blue-300">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold mb-1">How to get your Instagram data?</p>
          <ol className="list-decimal pl-4 space-y-1 opacity-90">
            <li>Open Instagram App settings {'>'} Your activity {'>'} Download your information</li>
            <li>Request a download in <strong>JSON format</strong> (not HTML!)</li>
            <li>Once received, extract the ZIP and find the files in the <em>followers_and_following</em> folder.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
