c:\uni-app_Project\test01_7_22\pages/threshold/threshold.vue
<template>
	<view class="container">
		<view class="input-section">
			<view class="input-label">
				<text class="label-text">重量阈值设置</text>
				<text class="unit-text">克(g)</text>
			</view>
			<input 
				class="threshold-input" 
				type="digit" 
				v-model="thresholdValue" 
				placeholder="请输入阈值"
				placeholder-class="input-placeholder"
			/>
			<view class="confirm-btn" @click="confirmThreshold">
				<text class="btn-text">确认设置</text>
			</view>
		</view>
		
		<view class="history-section">
			<view class="section-header">
				<text class="section-title">历史记录</text>
				<view v-if="historyList.length > 0" class="clear-btn" @click="clearHistory">
					<text class="clear-text">清空</text>
				</view>
			</view>
			<view class="history-list">
				<view v-if="historyList.length === 0" class="empty-history">
					<text class="empty-text">暂无设置记录</text>
				</view>
				<view v-else class="history-item" v-for="(item, index) in historyList" :key="index">
					<view class="history-value-wrap" @click="useHistory(item)">
						<text class="history-value">{{ item }} g</text>
						<text class="history-time">{{ getTimeStr(item) }}</text>
					</view>
					<view class="history-delete" @click="deleteHistory(item)">
						<text class="delete-icon">🗑️</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import bluetoothManager from '@/utils/bluetooth.js'
	
	export default {
		data() {
			return {
				thresholdValue: '',
				historyList: [],
				timeMap: {}
			}
		},
		onLoad() {
			this.loadHistory()
		},
		methods: {
			loadHistory() {
				try {
					const history = uni.getStorageSync('threshold_history')
					if (history) {
						this.historyList = JSON.parse(history)
					}
					const times = uni.getStorageSync('threshold_times')
					if (times) {
						this.timeMap = JSON.parse(times)
					}
				} catch (e) {
					console.error('读取历史记录失败:', e)
				}
			},
			
			saveHistory(value) {
				if (!this.historyList.includes(value)) {
					this.historyList.unshift(value)
					if (this.historyList.length > 10) {
						this.historyList.pop()
					}
					this.timeMap[value] = Date.now()
					
					try {
						uni.setStorageSync('threshold_history', JSON.stringify(this.historyList))
						uni.setStorageSync('threshold_times', JSON.stringify(this.timeMap))
					} catch (e) {
						console.error('保存历史记录失败:', e)
					}
				}
			},
			
			getTimeStr(value) {
				const time = this.timeMap[value]
				if (!time) return ''
				const date = new Date(time)
				return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
			},
			
			confirmThreshold() {
				const value = parseFloat(this.thresholdValue)
				
				if (isNaN(value) || value <= 0) {
					uni.showToast({ title: '请输入有效的数值', icon: 'none' })
					return
				}
				
				if (!bluetoothManager.getIsConnected()) {
					uni.showToast({ title: '请先连接蓝牙', icon: 'none' })
					return
				}
				
				uni.showLoading({ title: '发送中...' })
				
				bluetoothManager.sendCommand('setThreshold', value).then(() => {
					uni.hideLoading()
					uni.showToast({ title: '设置成功', icon: 'success' })
					this.saveHistory(value)
					this.thresholdValue = ''
				}).catch((err) => {
					uni.hideLoading()
					console.error('设置失败:', err)
					uni.showToast({ title: '设置失败', icon: 'none' })
				})
			},
			
			useHistory(value) {
				this.thresholdValue = String(value)
			},
			
			deleteHistory(value) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除 "${value}g" 吗？`,
					success: (res) => {
						if (res.confirm) {
							const index = this.historyList.indexOf(value)
							if (index > -1) {
								this.historyList.splice(index, 1)
								delete this.timeMap[value]
								try {
									uni.setStorageSync('threshold_history', JSON.stringify(this.historyList))
									uni.setStorageSync('threshold_times', JSON.stringify(this.timeMap))
								} catch (e) {
									console.error('删除记录失败:', e)
								}
							}
						}
					}
				})
			},
			
			clearHistory() {
				uni.showModal({
					title: '确认清空',
					content: '确定要清空所有历史记录吗？',
					success: (res) => {
						if (res.confirm) {
							this.historyList = []
							this.timeMap = {}
							try {
								uni.setStorageSync('threshold_history', JSON.stringify([]))
								uni.setStorageSync('threshold_times', JSON.stringify({}))
								uni.showToast({ title: '已清空', icon: 'success' })
							} catch (e) {
								console.error('清空历史记录失败:', e)
							}
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss">
	.container { min-height: 100vh; background: #f5f5f5; padding: 30rpx; }
	.input-section { background: #fff; border-radius: 20rpx; padding: 40rpx; margin-bottom: 30rpx; }
	.input-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; }
	.label-text { font-size: 32rpx; color: #333; font-weight: 600; }
	.unit-text { font-size: 28rpx; color: #999; }
	.threshold-input {
		width: 100%; height: 80rpx; background: #f8f8f8; border-radius: 16rpx;
		padding: 0 30rpx; font-size: 36rpx; color: #333; box-sizing: border-box;
	}
	.input-placeholder { color: #ccc; }
	.confirm-btn {
		margin-top: 40rpx; padding: 30rpx; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16rpx; text-align: center;
	}
	.btn-text { font-size: 32rpx; color: #fff; font-weight: 600; }
	
	.history-section { background: #fff; border-radius: 20rpx; padding: 40rpx; }
	.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; }
	.section-title { font-size: 32rpx; color: #333; font-weight: 600; }
	.clear-btn { padding: 10rpx 20rpx; background: #f5f5f5; border-radius: 8rpx; }
	.clear-text { font-size: 26rpx; color: #999; }
	.history-list { }
	.empty-history { text-align: center; padding: 40rpx; }
	.empty-text { font-size: 28rpx; color: #999; }
	.history-item {
		display: flex; justify-content: space-between; align-items: center;
		padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0;
		&:last-child { border-bottom: none; }
	}
	.history-value-wrap { flex: 1; }
	.history-value { font-size: 30rpx; color: #333; display: block; }
	.history-time { font-size: 24rpx; color: #999; }
	.history-delete { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
	.delete-icon { font-size: 28rpx; }
</style>