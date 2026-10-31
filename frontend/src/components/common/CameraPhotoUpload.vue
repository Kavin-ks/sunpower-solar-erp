<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Camera, Upload, RotateCcw, CheckCircle2, AlertCircle, X, Image as ImageIcon, Loader2 } from 'lucide-vue-next';
import { api } from '../../api/client';

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    captionPlaceholder?: string;
    defaultCaption?: string;
    allowedStages?: string[];
    selectedStage?: string;
  }>(),
  {
    title: 'Capture & Attach Photo',
    subtitle: 'Snap a live photo using device camera or select image from file picker',
    captionPlaceholder: 'e.g. South-facing rooftop shadow-free area',
    defaultCaption: '',
    allowedStages: () => [],
    selectedStage: '',
  }
);

const emit = defineEmits<{
  (e: 'photoUploaded', photoUrl: string, caption: string): void;
  (e: 'photo-uploaded', photoUrl: string, caption: string): void;
  (e: 'photoCaptured', photoUrl: string): void;
  (e: 'update:modelValue', photoUrl: string): void;
  (e: 'stageChange', stage: string): void;
  (e: 'close'): void;
}>();

const mode = ref<'camera' | 'file'>('camera');
const cameraActive = ref(false);
const cameraError = ref<string | null>(null);
const capturedBlob = ref<Blob | null>(null);
const previewUrl = ref<string | null>(null);
const caption = ref(props.defaultCaption);
const stage = ref(props.selectedStage || (props.allowedStages && props.allowedStages.length > 0 ? props.allowedStages[0] : ''));
const uploading = ref(false);
const uploadSuccess = ref(false);
const errorMessage = ref<string | null>(null);

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
let stream: MediaStream | null = null;

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  cameraActive.value = false;
};

const startCamera = async () => {
  cameraError.value = null;
  errorMessage.value = null;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API (getUserMedia) not supported in this browser. Please use the File Upload tab.');
    }

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
    }
    cameraActive.value = true;
  } catch (err: any) {
    console.warn('Camera access failed:', err);
    let msg = 'Camera unavailable or permission denied. Please switch to file upload.';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      msg = 'Camera permission was denied. Please allow camera access in browser settings or upload a file.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      msg = 'No camera found on this device. Please upload an image file instead.';
    }
    cameraError.value = msg;
    cameraActive.value = false;
    mode.value = 'file';
  }
};

const handleSnapPhoto = () => {
  if (!videoRef.value || !canvasRef.value) return;
  const video = videoRef.value;
  const canvas = canvasRef.value;
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, width, height);
  canvas.toBlob(
    (blob) => {
      if (blob) {
        capturedBlob.value = blob;
        previewUrl.value = URL.createObjectURL(blob);
        stopCamera();
      }
    },
    'image/jpeg',
    0.9
  );
};

const handleRetake = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  capturedBlob.value = null;
  previewUrl.value = null;
  errorMessage.value = null;
  if (mode.value === 'camera') {
    startCamera();
  }
};

const handleFileChange = (e: Event) => {
  errorMessage.value = null;
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;
  const file = files[0];

  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = 'File size exceeds 10MB limit. Please choose a smaller image.';
    return;
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    errorMessage.value = 'Invalid file format. Allowed formats: JPG, PNG, WEBP.';
    return;
  }

  capturedBlob.value = file;
  previewUrl.value = URL.createObjectURL(file);
};

const handleUploadAndSave = async () => {
  if (!capturedBlob.value) {
    errorMessage.value = 'Please snap a photo or choose an image file first.';
    return;
  }

  uploading.value = true;
  errorMessage.value = null;

  try {
    const formData = new FormData();
    const fileName = capturedBlob.value instanceof File ? capturedBlob.value.name : `photo_${Date.now()}.jpg`;
    formData.append('file', capturedBlob.value, fileName);

    const uploadRes = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const photoUrl = uploadRes.data?.url;
    if (!photoUrl) {
      throw new Error('Backend failed to return stored photo URL.');
    }

    const finalCaption = caption.value.trim() || 'Site Photo';
    if (stage.value) {
      emit('stageChange', stage.value);
    }
    emit('photoUploaded', photoUrl, finalCaption);
    emit('photo-uploaded', photoUrl, finalCaption);
    emit('photoCaptured', photoUrl);
    emit('update:modelValue', photoUrl);

    uploadSuccess.value = true;
    setTimeout(() => {
      emit('close');
    }, 600);
  } catch (err: any) {
    console.error('Photo upload failed:', err);
    errorMessage.value = err.response?.data?.message || err.message || 'Failed to upload photo to central server.';
  } finally {
    uploading.value = false;
  }
};

watch(mode, (newMode) => {
  if (newMode === 'camera' && !capturedBlob.value) {
    startCamera();
  } else {
    stopCamera();
  }
});

onMounted(() => {
  if (mode.value === 'camera' && !capturedBlob.value) {
    startCamera();
  }
});

onBeforeUnmount(() => {
  stopCamera();
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera class="w-5 h-5 text-emerald-600" />
            {{ title }}
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">{{ subtitle }}</p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content Body -->
      <div class="p-6 overflow-y-auto space-y-4">
        <!-- Mode Switcher Tabs -->
        <div v-if="!previewUrl" class="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            @click="mode = 'camera'"
            :class="[
              'flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer',
              mode === 'camera' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            ]"
          >
            <Camera class="w-3.5 h-3.5" />
            Live Camera Snap
          </button>
          <button
            type="button"
            @click="mode = 'file'"
            :class="[
              'flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer',
              mode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            ]"
          >
            <Upload class="w-3.5 h-3.5" />
            Upload Photo File
          </button>
        </div>

        <!-- Camera Error Alert -->
        <div v-if="cameraError && mode === 'camera' && !previewUrl" class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p class="font-semibold">{{ cameraError }}</p>
            <p class="text-[11px] text-amber-700 mt-0.5">Switched to file upload mode for convenience.</p>
          </div>
        </div>

        <!-- General Error Message -->
        <div v-if="errorMessage" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Success Badge -->
        <div v-if="uploadSuccess" class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          <span class="font-semibold">Photo successfully uploaded and attached to central record!</span>
        </div>

        <!-- Viewfinder / Preview Container -->
        <div class="relative bg-slate-900 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-200 shadow-inner">
          <template v-if="previewUrl">
            <img :src="previewUrl" alt="Preview" class="w-full h-full object-contain" />
          </template>
          <template v-else-if="mode === 'camera'">
            <video
              ref="videoRef"
              playsinline
              muted
              :class="['w-full h-full object-cover', cameraActive ? 'block' : 'hidden']"
            ></video>
            <div v-if="!cameraActive" class="text-center p-4">
              <Loader2 class="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
              <p class="text-xs text-slate-300">Initializing device camera stream...</p>
            </div>
          </template>
          <template v-else>
            <div
              @click="fileInputRef?.click()"
              class="text-center p-6 cursor-pointer hover:bg-slate-800/80 transition w-full h-full flex flex-col items-center justify-center"
            >
              <div class="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3 shadow-md">
                <ImageIcon class="w-6 h-6 text-emerald-400" />
              </div>
              <p class="text-sm font-semibold text-white">Click to Select Site Photograph</p>
              <p class="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP up to 10MB</p>
              <span class="mt-3 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
                Browse Files
              </span>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                capture="environment"
                @change="handleFileChange"
                class="hidden"
              />
            </div>
          </template>

          <canvas ref="canvasRef" class="hidden"></canvas>
        </div>

        <!-- Camera Action Buttons -->
        <button
          v-if="!previewUrl && mode === 'camera' && cameraActive"
          type="button"
          @click="handleSnapPhoto"
          class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
        >
          <Camera class="w-4 h-4" />
          Snap Photograph Now
        </button>

        <div v-if="previewUrl" class="flex gap-2">
          <button
            type="button"
            @click="handleRetake"
            :disabled="uploading || uploadSuccess"
            class="flex-1 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            Retake / Change Photo
          </button>
        </div>

        <!-- Form Fields: Caption & Stage -->
        <form v-if="previewUrl" @submit.prevent="handleUploadAndSave" class="space-y-3 pt-2 border-t border-slate-100 text-xs">
          <div v-if="allowedStages && allowedStages.length > 0">
            <label class="block font-semibold text-slate-700 mb-1">Installation Stage *</label>
            <select
              v-model="stage"
              required
              class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-slate-800"
            >
              <option v-for="s in allowedStages" :key="s" :value="s">
                {{ s }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Photo Description / Notes *</label>
            <input
              type="text"
              required
              v-model="caption"
              :placeholder="captionPlaceholder"
              class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              @click="emit('close')"
              :disabled="uploading"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="uploading || uploadSuccess"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <template v-if="uploading">
                <Loader2 class="w-4 h-4 animate-spin" />
                Uploading & Saving...
              </template>
              <template v-else>
                <Upload class="w-4 h-4" />
                Upload & Attach to Record
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
