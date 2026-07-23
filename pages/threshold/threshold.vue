c:\uni-app_Project\test01_7_22\pages\threshold\threshold.vue
<template>
	<view class="container">
		<view class="nav-bar">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="nav-title">阈值设置</text>
			<view class="placeholder"></view>
		</view>
		
		<view class="content">
			<view class="setting-item">
				<text class="label">重量阈值</text>
				<view class="input-row">
					<input class="input" type="number" v-model="threshold" placeholder="请输入阈值">
					<text class="unit">克</text>
				</view>
			</view>
			
			<view class="info-box">
				<text class="info-title">说明</text>
				<text class="info-content">设置检测的重量阈值，当检测到的重量超过此值时，系统会触发相应的告警或控制动作。</text>
			</view>
			
			<view class="btn-confirm" @click="confirmThreshold">
				<text class="confirm-text">确认设置</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				threshold: ''
			}
		},
		onLoad() {
			const savedThreshold = uni.getStorageSync('threshold')
			if (savedThreshold) {
				this.threshold = savedThreshold.toString()
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			
			confirmThreshold() {
				if (!this.threshold || isNaN(this.threshold)) {
					uni.showToast({
						title: '请输入有效数值',
						icon: 'none'
					})
					return
				}
				
				const value = parseInt(this.threshold)
				if (value <= 0) {
					uni.showToast({
						title: '阈值必须大于0',
						icon: 'none'
					})
					return
				}
				
				uni.setStorageSync('threshold', value)
				uni.showToast({
					title: '设置成功',
					icon: 'success'
				})
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: #f5f5f5;
	}
	
	.nav-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 40rpx 30rpx;
		background: #fff;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.back-btn {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f0f0;
		border-radius: 50%;
	}
	
	.back-icon {
		font-size: 40rpx;
		color: #333;
	}
	
	.nav-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
	
	.placeholder {
		width: 80rpx;
	}
	
	.content {
		padding: 40rpx 30rpx;
	}
	
	.setting-item {
		background: #fff;
		border-radius: 20rpx;
		padding: 40rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.label {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 30rpx;
		display: block;
	}
	
	.input-row {
		display: flex;
		align-items: center;
		border-bottom: 2rpx solid #eee;
		padding-bottom: 20rpx;
	}
	
	.input {
		flex: 1;
		font-size: 48rpx;
		color: #333;
		font-weight: bold;
	}
	
	.unit {
		font-size: 32rpx;
		color: #666;
		margin-left: 10rpx;
	}
	
	.info-box {
		background: linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%);
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 50rpx;
		border-left: 6rpx solid #ff9800;
	}
	
	.info-title {
		font-size: 28rpx;
		color: #ff9800;
		font-weight: 600;
		margin-bottom: 15rpx;
		display: block;
	}
	
	.info-content {
		font-size: 26rpx;
		color: #666;
		line-height: 1.6;
	}
	
	.btn-confirm {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 24rpx;
		padding: 35rpx;
		text-align: center;
		box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
	}
	
	.confirm-text {
		font-size: 36rpx;
		color: #fff;
		font-weight: bold;
	}
</style>