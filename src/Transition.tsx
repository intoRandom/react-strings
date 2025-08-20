import { ReactNode, FC } from 'react';

export const TransitionComponent: FC<{
	children: ReactNode;
	bgColor: string;
	duration: number;
	isReady: boolean;
}> = ({ children, bgColor, duration, isReady }) => {
	return (
		<div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
			{children}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: bgColor,
					transition: isReady ? `opacity ${duration}ms ease-out` : '',
					opacity: isReady ? 0 : 1,
					pointerEvents: isReady ? 'none' : 'auto',
				}}
			/>
		</div>
	);
};
