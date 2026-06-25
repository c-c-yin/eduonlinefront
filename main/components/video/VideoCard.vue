<style scoped>
.video-card {
  background: var(--bg-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-sm);
  position: relative;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.video-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.video-card:hover .cover-image {
  transform: scale(1.05);
}

.tag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
  font-weight: 600;
}

.course-type-tag {
  background: var(--primary-color);
}

.free-tag {
  top: auto;
  bottom: 10px;
  left: 10px;
  background: var(--danger-color);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.5) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 40px;
  color: #fff;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.video-info {
  padding: 14px;
}

.video-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 42px;
  transition: color 0.2s;
}

.video-card:hover .video-title {
  color: var(--primary-color);
}

.teacher-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-light);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: var(--primary-color);
  font-weight: 600;
  white-space: nowrap;
}

.video-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.study-count {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

@media (max-width: 768px) {
  .video-info {
    padding: 12px;
  }

  .video-title {
    font-size: 13px;
  }
}
</style>
