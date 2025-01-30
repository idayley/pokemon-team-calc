import { typeColors } from '../../data/typeColors';

const TypeBadge = ({ type, small = false }) => (
  <span className={`${typeColors[type]} ${
    small ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  } text-white rounded-full font-medium capitalize`}>
    {type}
  </span>
);

export default TypeBadge;
