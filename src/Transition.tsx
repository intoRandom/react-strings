import { ReactNode, FC } from 'react';

export const TransitionComponent: FC<{
	children: ReactNode;
	bgColor: string;
	duration: number;
	direction: 'ltr' | 'rtl' | undefined;
	isReady: boolean;
}> = ({ children, bgColor, duration, direction = 'ltr', isReady }) => {
	return (
		<div style={{ position: 'relative' }} dir={direction}>
			{children}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					zIndex: 9999,
					background: bgColor,
					transition: isReady ? `opacity ${duration}ms ease-out` : '',
					opacity: isReady ? 0 : 1,
					pointerEvents: isReady ? 'none' : 'auto',
				}}
			/>
		</div>
	);
};
