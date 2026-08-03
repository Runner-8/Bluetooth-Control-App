c:\uni-app_Project\test01_7_22\pages\threshold\threshold.vue
<template>
	<view class="container">
		<!-- 重量显示区域（新增） -->
		<view class="weight-display-section">
			<view class="weight-header">
				<text class="weight-title">当前重量</text>
				<text class="weight-status" :class="{ connected: isConnected }">
					{{ isConnected ? '实时监测中' : '未连接' }}
				</text>
			</view>
			<view class="weight-value-wrap">
				<text class="weight-value">{{ currentWeight.toFixed(1) }}</text>
				<text class="weight-unit">g</text>
			</view>
			<view class="weight-bar">
				<view class="weight-bar-fill" :style="{ width: weightBarWidth + '%' }"></view>
			</view>
			<view class="weight-info">
				<text class="info-text">阈值: {{ threshold }}g</text>
				<text class="info-text">状态: {{ weightStatus }}</text>
			</view>
		</view>
		
		<!-- 阈值设置区域 -->
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
		
		<!-- 历史记录区域 -->
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
		
		<!-- 超重报警弹窗（新增） -->
		<view class="alert-modal" v-if="showAlert" @click="closeAlert">
			<view class="alert-content" @click.stop>
				<text class="alert-icon">⚠️</text>
				<text class="alert-title">超重警报</text>
				<text class="alert-message">当前重量已超过设定阈值！</text>
				<text class="alert-weight">重量: {{ currentWeight.toFixed(1) }}g</text>
				<text class="alert-threshold">阈值: {{ threshold }}g</text>
				<view class="alert-btn" @click="closeAlert">
					<text class="btn-text">确定</text>
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
				timeMap: {},
				currentWeight: 0,
				threshold: 0,
				isConnected: false,
				showAlert: false,
				weightAlertTimer: null
			}
		},
		computed: {
			weightBarWidth() {
				const maxWeight = Math.max(this.threshold * 2, 100)
				return Math.min((this.currentWeight / maxWeight) * 100, 100)
			},
			weightStatus() {
				if (this.currentWeight >= this.threshold && this.threshold > 0) {
					return '已达阈值'
				} else if (this.currentWeight > 0) {
					return '正常'
				}
				return '无数据'
			}
		},
		onLoad() {
			this.loadHistory()
			this.isConnected = bluetoothManager.getIsConnected()
			bluetoothManager.addListener(this.onConnectionChange)
			bluetoothManager.addDataListener(this.onDataReceived)
			
			// 加载保存的阈值
			const savedThreshold = uni.getStorageSync('current_threshold')
			if (savedThreshold) {
				this.threshold = savedThreshold
			}
		},
		onShow() {
			this.isConnected = bluetoothManager.getIsConnected()
		},
		onUnload() {
			bluetoothManager.removeListener(this.onConnectionChange)
			bluetoothManager.removeDataListener(this.onDataReceived)
			if (this.weightAlertTimer) {
				clearTimeout(this.weightAlertTimer)
			}
		},
		methods: {
			onConnectionChange(device, isConnected) {
				this.isConnected = isConnected
			},
			
			onDataReceived(cmd, data) {
				console.log('收到数据:', cmd, data)
				
				// 命令10：重量上报
				if (cmd === 10 && data.length >= 4) {
					const weight = bluetoothManager.parseFloatFromBytes(data)
					this.currentWeight = weight
					console.log('当前重量:', weight.toFixed(1), 'g')
					
					// 检查是否超重
					if (this.threshold > 0 && weight >= this.threshold) {
						this.triggerWeightAlert()
					}
				}
				
				// 命令11：超重标志位上报
				if (cmd === 11) {
					console.log('收到超重标志')
					this.triggerWeightAlert()
				}
			},
			
			triggerWeightAlert() {
				// 防止频繁弹窗，添加防抖
				if (this.weightAlertTimer) {
					clearTimeout(this.weightAlertTimer)
				}
				
				this.weightAlertTimer = setTimeout(() => {
					this.showAlert = true
				}, 500)
			},
			
			closeAlert() {
				this.showAlert = false
			},
			
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
				
				if (!this.isConnected) {
					uni.showToast({ title: '请先连接蓝牙', icon: 'none' })
					return
				}
				
				uni.showLoading({ title: '发送中...' })
				
				bluetoothManager.sendCommand('setThreshold', value).then(() => {
					uni.hideLoading()
					uni.showToast({ title: '设置成功', icon: 'success' })
					this.saveHistory(value)
					this.threshold = value
					// 保存阈值到本地
					uni.setStorageSync('current_threshold', value)
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
	
	/* 重量显示区域 */
	.weight-display-section {
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		border-radius: 20rpx; padding: 40rpx; margin-bottom: 30rpx;
	}
	.weight-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
	.weight-title { font-size: 28rpx; color: rgba(255,255,255,0.8); }
	.weight-status { font-size: 24rpx; color: #ff9800; }
	.weight-status.connected { color: #4caf50; }
	
	.weight-value-wrap { display: flex; align-items: baseline; justify-content: center; margin-bottom: 30rpx; }
	.weight-value { font-size: 96rpx; color: #fff; font-weight: bold; }
	.weight-unit { font-size: 36rpx; color: rgba(255,255,255,0.6); margin-left: 10rpx; }
	
	.weight-bar {
		height: 16rpx; background: rgba(255,255,255,0.2); border-radius: 8rpx; overflow: hidden; margin-bottom: 20rpx;
	}
	.weight-bar-fill {
		height: 100%; background: linear-gradient(90deg, #4caf50 0%, #ff9800 70%, #f44336 100%);
		transition: width 0.3s ease;
	}
	
	.weight-info { display: flex; justify-content: space-between; }
	.info-text { font-size: 24rpx; color: rgba(255,255,255,0.6); }
	
	/* 阈值设置区域 */
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
	
	/* 历史记录区域 */
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
	
	/* 超重报警弹窗 */
	.alert-modal {
		position: fixed; top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
		z-index: 9999;
	}
	.alert-content {
		background: #fff; border-radius: 24rpx; padding: 60rpx 50rpx;
		width: 80%; max-width: 600rpx; text-align: center;
		animation: alertPop 0.3s ease;
	}
	@keyframes alertPop {
		0% { transform: scale(0.8); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}
	.alert-icon { font-size: 80rpx; display: block; margin-bottom: 20rpx; }
	.alert-title { font-size: 36rpx; color: #f44336; font-weight: bold; display: block; margin-bottom: 20rpx; }
	.alert-message { font-size: 28rpx; color: #333; display: block; margin-bottom: 30rpx; }
	.alert-weight { font-size: 32rpx; color: #f44336; display: block; margin-bottom: 10rpx; }
	.alert-threshold { font-size: 28rpx; color: #666; display: block; margin-bottom: 40rpx; }
	.alert-btn {
		padding: 25rpx 60rpx; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 40rpx; display: inline-block;
	}
</style>