import { useState, useEffect } from 'react';
import { Image, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import ConfirmModal from '../components/ConfirmModal';
import { getGenerations, deleteGeneration, downloadGeneration } from '../lib/api';
import { useGenerationStore } from '../store/useStore';
import type { Generation, GenerationsResponse } from '../lib/api';

const History = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const { setGenerations: setStoreGenerations, triggerRefresh } = useGenerationStore();

  useEffect(() => {
    const fetchGenerations = async () => {
      try {
        const response: GenerationsResponse = await getGenerations(page, limit);
        setGenerations(response.data);
        setTotal(response.total);
      } catch (error) {
        console.error('Failed to fetch generations:', error);
      }
    };

    fetchGenerations();
  }, [page, limit]);

  const handleDeleteClick = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleDeleteConfirm = async () => {
    const id = confirmModal.id;
    if (!id) return;

    try {
      await deleteGeneration(id);
      setGenerations((prev) => {
        const updated = prev.filter((g) => g.id !== id);
        setStoreGenerations(updated);
        return updated;
      });
      setTotal((prev) => prev - 1);
      triggerRefresh();
    } catch (error) {
      console.error('Failed to delete generation:', error);
      window.alert('Failed to delete generation. Please try again.');
    }
  };

  const handleDownload = async (generationId: string) => {
    try {
      const blob = await downloadGeneration(generationId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-${generationId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-lg font-semibold text-white flex items-center gap-2">
          <Image className="w-5 h-5 text-cyan-400" />
          Generation History
        </h2>
        <span className="text-sm text-white/60">
          {total} total generations
        </span>
      </div>

      {generations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((generation) => (
              <div
                key={generation.id}
                className="group relative rounded-xl overflow-hidden bg-white/5"
              >
                <img
                  src={generation.image_url}
                  alt={generation.prompt}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-sm truncate mb-3">{generation.prompt}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDownload(generation.id)}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(generation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                  generation.status === 'succeeded'
                    ? 'bg-green-500/80 text-white'
                    : 'bg-red-500/80 text-white'
                }`}>
                  {generation.status}
                </span>
                <span className="absolute top-3 right-3 text-xs text-white/70 bg-black/50 px-2 py-1 rounded-full">
                  {new Date(generation.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-white/70 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-white/40">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No generation history</p>
          <p className="text-sm">Start generating images to see them here</p>
        </div>
      )}
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Generation"
        message="Are you sure you want to delete this generation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Card>
  );
};

export default History;
