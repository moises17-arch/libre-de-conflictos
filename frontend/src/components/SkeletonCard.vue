<template>
  <div class="skeleton-card">
    <div v-if="showTitle" class="skeleton-title skeleton-shimmer"></div>
    <div v-for="n in lines" :key="n" class="skeleton-line skeleton-shimmer"></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  lines?: number;
  showTitle?: boolean;
}>(), {
  lines: 3,
  showTitle: true
});
</script>

<style scoped>
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-card {
  padding: 1rem;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 0.75rem;
}
.skeleton-shimmer {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}
.skeleton-title {
  height: 1.25rem;
  width: 60%;
  margin-bottom: 0.75rem;
}
.skeleton-line {
  height: 0.875rem;
  width: 100%;
  margin-bottom: 0.5rem;
}
.skeleton-line:last-child {
  width: 80%;
}
</style>
