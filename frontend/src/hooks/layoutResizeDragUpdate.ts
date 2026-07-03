import {
  getPaneMouseResizePercent,
  getSidebarMouseResizeWidth,
} from './layoutResize';

interface LayoutResizeElement {
  getBoundingClientRect: () => {
    left: number;
    width: number;
  };
}

interface LayoutResizeDragUpdateInput {
  clientX: number;
  appElement: LayoutResizeElement | null;
  sidebarWidth: number;
  isResizingSidebar: boolean;
  isResizingPane: boolean;
  setSidebarWidth: (width: number) => void;
  setLeftPaneWidthPercent: (percent: number) => void;
}

export const updateLayoutResizeDrag = ({
  clientX,
  appElement,
  sidebarWidth,
  isResizingSidebar,
  isResizingPane,
  setSidebarWidth,
  setLeftPaneWidthPercent,
}: LayoutResizeDragUpdateInput) => {
  if (isResizingSidebar) {
    setSidebarWidth(getSidebarMouseResizeWidth(clientX));
  }

  if (!isResizingPane || !appElement) return;

  const appRect = appElement.getBoundingClientRect();
  setLeftPaneWidthPercent(getPaneMouseResizePercent({
    clientX,
    appLeft: appRect.left,
    appWidth: appRect.width,
    sidebarWidth,
  }));
};
