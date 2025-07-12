import { TreeItem } from "@/types"
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarGroup,
  SidebarMenu,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { ChevronRight, FileIcon, FolderIcon } from "lucide-react";

interface Props {
  data : TreeItem[]
  onSelect?: (filePath: string) => void
  value?: string | null
}

export const TreeView = ({
  data,
  onSelect,
  value
}: Props) => {
  return (
    <SidebarProvider className="h-full">
      <Sidebar collapsible="none" className="w-full">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.map((item, index) => (
                  <Tree
                    key={index}
                    item={item}
                    onSelect={onSelect}
                    value={value}
                    parentPath=""
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}

interface TreeProps {
  item: TreeItem;
  onSelect?: (filePath: string) => void;
  value?: string | null;
  parentPath: string;
}

const Tree = ({
  item,
  onSelect,
  value,
  parentPath
}: TreeProps)=>{

  const [name, ...items] = Array.isArray(item) ? item : [item];
  const currentPath = parentPath ? `${parentPath}/${name}` : name;


  if (!items.length) {
    const isSelected = value === currentPath;
    return (
      <SidebarMenuButton
        isActive={isSelected}
        onClick={() => onSelect?.(currentPath)}
        className="data-[active=true]:bg-transparent"
      >
        <FileIcon/>
        <span className="truncate">{name}</span>
      </SidebarMenuButton>
    )
  }

  return (
    <SidebarMenuItem>
      <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90" defaultOpen>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform"/>
            <FolderIcon/>
            <span className="truncate">{name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem, index) => (
              <Tree
                key={`${currentPath}-${index}`}
                item={subItem}
                onSelect={onSelect}
                value={value}
                parentPath={currentPath}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )

}
