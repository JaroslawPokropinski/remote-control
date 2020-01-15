interface ClientResizeDTO {
  type: 'clientresize';
  w: number;
  h: number;
}

interface MouseDownDTO {
  type: 'mousedown';
  x: number;
  y: number;
}

interface MouseUpDTO {
  type: 'mouseup';
  x: number;
  y: number;
}

interface MouseMoveDTO {
  type: 'mousemove';
  x: number;
  y: number;
}

export type DTO = ClientResizeDTO | MouseDownDTO | MouseUpDTO | MouseMoveDTO;