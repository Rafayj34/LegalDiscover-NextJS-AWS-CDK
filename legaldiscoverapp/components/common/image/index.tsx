import Image, { ImageProps } from "next/image";

type CustomImageProps = {
    className?: string;
} & (
        | {
            width: number;
            height: number;
        }
        | {
            width?: never;
            height?: never;
        }
    ) &
    Pick<ImageProps, "src" | "alt">;

export const CustomImage = ({
    src,
    alt,
    className,
    ...props
}: CustomImageProps) => {
    return (
        <Image
            src={src}
            alt={alt}
            className={className}
            {...props}
        />
    );
};
