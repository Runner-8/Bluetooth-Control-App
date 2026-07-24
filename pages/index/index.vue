<template>
	<view class="container">
		<view class="header">
			<text class="title">   </text>
		</view>
		<view class="button-list">
			<view class="btn-item" @click="goToBluetooth">
				<view class="btn-icon">
					<text class="icon-text">BT</text>
				</view>
				<text class="btn-text">蓝牙连接</text>
			</view>
			
			<view class="btn-item" @click="goToThreshold">
				<view class="btn-icon">
					<text class="icon-text">SE</text>
				</view>
				<text class="btn-text">阈值设置</text>
			</view>
			
			<view class="btn-item" :class="{ active: autoInspect }" @click="toggleAutoInspect">
				<view class="btn-icon">
					<text class="icon-text">AI</text>
				</view>
				<text class="btn-text">自动巡检</text>
			</view>
			
			<view class="btn-item" @click="goToControl">
				<view class="btn-icon">
					<text class="icon-text">CT</text>
				</view>
				<text class="btn-text">小车控制</text>
			</view>
		</view>
		
		<view v-if="autoInspect" class="status-bar">
			<text class="status-text">自动巡检中...</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				autoInspect: false
			}
		},
		onLoad() {
			
		},
		methods: {
			goToBluetooth() {
				uni.navigateTo({
					url: '/pages/bluetooth/bluetooth'
				})
			},
			
			goToThreshold() {
				uni.navigateTo({
					url: '/pages/threshold/threshold'
				})
			},
			
			toggleAutoInspect() {
					this.autoInspect = !this.autoInspect
					if (this.autoInspect) {
						uni.showToast({
							title: '已开启自动巡检',
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: '已关闭自动巡检',
							icon: 'none'
						})
					}
				},
			
			goToControl() {
				uni.navigateTo({
					url: '/pages/control/control'
				})
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 40rpx;
		box-sizing: border-box;
	}
	
	.header {
		text-align: center;
		padding: 60rpx 0 80rpx;
	}
	
	.title {
		font-size: 56rpx;
		font-weight: bold;
		color: #fff;
		text-shadow: 2rpx 2rpx 4rpx rgba(0,0,0,0.3);
	}
	
	.button-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 60rpx;
	}
	
	.btn-item {
		width: 100%;
		max-width: 560rpx;
		background: rgba(255,255,255,0.95);
		border-radius: 24rpx;
		padding: 40rpx 20rpx;
		margin-bottom: 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.15);
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.95);
			background: rgba(255,255,255,0.85);
		}
		
		&.active {
			background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
			
			.btn-text {
				color: #fff;
			}
		}
	}
	
	.btn-icon {
		width: 100rpx;
		height: 100rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20rpx;
	}
	
	.icon-bluetooth {
		width: 48rpx;
		height: 48rpx;
		border: 4rpx solid #fff;
		border-radius: 50%;
		position: relative;
		
		&::before {
			content: '';
			position: absolute;
			width: 16rpx;
			height: 24rpx;
			background: #fff;
			left: 8rpx;
			top: 8rpx;
			border-radius: 4rpx;
			transform: rotate(-30deg);
		}
		
		&::after {
			content: '';
			position: absolute;
			width: 8rpx;
			height: 16rpx;
			background: #fff;
			right: 12rpx;
			top: 16rpx;
			border-radius: 4rpx;
			transform: rotate(30deg);
		}
	}
	
	.icon-settings {
		width: 48rpx;
		height: 48rpx;
		border: 4rpx solid #fff;
		border-radius: 50%;
		position: relative;
		
		&::before {
			content: '';
			position: absolute;
			width: 0;
			height: 0;
			border-left: 10rpx solid transparent;
			border-right: 10rpx solid transparent;
			border-bottom: 12rpx solid #fff;
			top: -4rpx;
			left: 50%;
			transform: translateX(-50%);
		}
	}
	
	.icon-scan {
		width: 48rpx;
		height: 48rpx;
		border: 4rpx solid #fff;
		border-radius: 50%;
		position: relative;
		
		&::before {
			content: '';
			position: absolute;
			width: 16rpx;
			height: 16rpx;
			background: #fff;
			border-radius: 4rpx;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
		}
		
		&::after {
			content: '';
			position: absolute;
			width: 8rpx;
			height: 8rpx;
			background: #667eea;
			border-radius: 50%;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
		}
	}
	
	.icon-control {
		width: 48rpx;
		height: 48rpx;
		position: relative;
		
		&::before {
			content: '';
			position: absolute;
			width: 40rpx;
			height: 40rpx;
			border: 4rpx solid #fff;
			border-radius: 8rpx;
			left: 0;
			top: 0;
		}
		
		&::after {
			content: '';
			position: absolute;
			width: 20rpx;
			height: 4rpx;
			background: #fff;
			left: 14rpx;
			top: 22rpx;
		}
	}
	
	.btn-text {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
	}
	
	.status-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
		padding: 30rpx;
		text-align: center;
		box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
	}
	
	.status-text {
		font-size: 32rpx;
		color: #fff;
		font-weight: 600;
	}
</style>