<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import { useI18n, useTheme } from '../composables'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { resolved, setMode } = useTheme()

const navItems = [
  { label: 'main.home', path: '/main', icon: 'i-carbon:chat' },
  { label: 'main.settings', path: '/main/settings', icon: 'i-carbon:settings' },
  {
    label: 'main.statistics',
    path: '/main/statistics',
    icon: 'i-carbon:chart-line-data',
  },
]

const themeIcon = computed(() =>
  resolved.value === 'dark' ? 'i-carbon:sun' : 'i-carbon:moon',
)

function toggleTheme() {
  void setMode(resolved.value === 'dark' ? 'light' : 'dark')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <img src="/logo.svg" alt="logo" class="brand-logo" />
        <span class="brand-name">Quick Toolbar</span>
      </div>

      <nav class="nav">
        <button
          v-for="item in navItems"
          :key="item.path"
          type="button"
          class="nav-item"
          :class="{ 'is-active': route.path === item.path }"
          @click="router.push(item.path)"
        >
          <Icon :class="item.icon" />
          <span>{{ t(item.label) }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="nav-item" @click="toggleTheme">
          <Icon :class="themeIcon" />
          <span>{{ t('basicsetting.theme') }}</span>
        </button>
      </div>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app-shell {
  display: flex;
  height: 100vh;
  background: var(--color-canvas);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 140px;
  padding: 10px;
  border-right: 1px solid var(--color-line);
  background: var(--color-surface);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
}

.brand-logo {
  width: 22px;
  height: 22px;
}

.brand-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink);
}

.nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-ink-muted);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-2);
    color: var(--color-ink);
  }

  &.is-active {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }
}

.sidebar-footer {
  padding-top: 8px;
  border-top: 1px solid var(--color-line);
}

.content {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
</style>
