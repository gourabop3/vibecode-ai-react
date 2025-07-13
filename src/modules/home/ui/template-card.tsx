import Image from "next/image"

interface Props {
  title: string;
  imageUrl: string;
}

export const TemplateCard = ({
  title,
  imageUrl
}: Props) => {
  return (
    <div className="w-full space-y-2">
      <div className="size-full aspect-video relative rounded-md overflow-hidden border">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <p className="font-medium text-left text-muted-foreground text-sm">
        {title}
      </p>
    </div>
  )
}
