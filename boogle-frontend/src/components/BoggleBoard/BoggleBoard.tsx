import React from 'react';
import Box from '@mui/material/Box';
import CSS from 'csstype'
const BoggleBoard: React.FC = () => {
  const gridContainerStyle:CSS.Properties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '70%',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    padding: '20px 50px 0px 50px', // Add some padding for better visibility
    margin: 'auto'
  };

  const boxStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '60px',
    border: '2px solid grey',
    color: 'white',
    fontSize: '24px',
  };

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];

  return (
    <div style={gridContainerStyle}>
      {letters.map((letter, index) => (
        <Box key={index} sx={boxStyle}>
          {letter}
        </Box>
      ))}
    </div>
  );
};

export default BoggleBoard;
