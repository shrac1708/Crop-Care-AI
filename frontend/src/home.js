import { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import { Paper, CardActionArea, CardMedia, Grid, TableContainer, Table, TableBody, TableHead, TableRow, TableCell, Button, CircularProgress } from "@mui/material";
import cblogo from "./cblogo.PNG";
import bgImage from "./bg.png";
import { common } from '@mui/material/colors';
import Clear from '@mui/icons-material/Clear';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from "axios";
import { useDropzone } from 'react-dropzone';

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(common.white),
  backgroundColor: common.white,
  '&:hover': {
    backgroundColor: '#ffffff7a',
  },
}));

const DropzoneArea = ({ onChange, dropzoneText, acceptedFiles }) => {
  const accept = acceptedFiles
    ? Object.fromEntries(acceptedFiles.map((t) => [t, []]))
    : { 'image/*': [] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: false,
    onDrop: (files) => onChange(files),
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: `2px dashed ${isDragActive ? '#be6a77' : '#aaa'}`,
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#fdf0f2' : 'transparent',
        transition: 'background-color 0.2s, border-color 0.2s',
      }}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon sx={{ fontSize: 48, color: '#be6a77', mb: 1 }} />
      <Typography variant="body1" color="textSecondary">
        {isDragActive ? 'Drop the image here…' : dropzoneText}
      </Typography>
    </Box>
  );
};

export const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState();
  const [preview, setPreview] = useState();
  const [data, setData] = useState();
  const [image, setImage] = useState(false);
  const [isLoading, setIsloading] = useState(false);
  let confidence = 0;

  const sendFile = async () => {
    if (image) {
      let formData = new FormData();
      formData.append("file", selectedFile);
      let res = await axios({
        method: "post",
        url: process.env.REACT_APP_API_URL,
        data: formData,
      });
      if (res.status === 200) {
        setData(res.data);
      }
      setIsloading(false);
    }
  };

  const clearData = () => {
    setData(null);
    setImage(false);
    setSelectedFile(null);
    setPreview(null);
  };

  useEffect(() => {
    if (!selectedFile) {
      setPreview(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  }, [selectedFile]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!preview) {
      return;
    }
    setIsloading(true);
    sendFile();
  }, [preview]);

  const onSelectFile = (files) => {
    if (!files || files.length === 0) {
      setSelectedFile(undefined);
      setImage(false);
      setData(undefined);
      return;
    }
    setSelectedFile(files[0]);
    setData(undefined);
    setImage(true);
  };

  if (data) {
    confidence = (parseFloat(data.confidence) * 100).toFixed(2);
  }

  const tableCellSx = {
    fontSize: '22px',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: '#000000a6',
    fontWeight: 'bolder',
    padding: '1px 24px 1px 16px',
  };

  const tableCell1Sx = {
    fontSize: '14px',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: '#000000a6',
    fontWeight: 'bolder',
    padding: '1px 24px 1px 16px',
  };

  return (
    <React.Fragment>
      <AppBar position="static" sx={{ background: '#be6a77', boxShadow: 'none', color: 'white' }}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            Crop-Care-AI
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Avatar src={cblogo} />
        </Toolbar>
      </AppBar>
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          backgroundImage: `url(${bgImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          height: '93vh',
          marginTop: '8px',
        }}
      >
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          sx={{ justifyContent: 'center', padding: '4em 1em 0 1em' }}
        >
          <Grid item xs={12}>
            <Card
              sx={{
                margin: 'auto',
                maxWidth: 400,
                height: image ? 500 : 'auto',
                backgroundColor: 'transparent',
                boxShadow: '0px 9px 70px 0px rgb(0 0 0 / 30%) !important',
                borderRadius: '15px',
              }}
            >
              {image && (
                <CardActionArea>
                  <CardMedia
                    sx={{ height: 400 }}
                    image={preview}
                    component="img"
                    title="Contemplative Reptile"
                  />
                </CardActionArea>
              )}
              {!image && (
                <CardContent>
                  <DropzoneArea
                    acceptedFiles={['image/*']}
                    dropzoneText={"Drag and drop an image of a crop leaf to process"}
                    onChange={onSelectFile}
                  />
                </CardContent>
              )}
              {data && (
                <CardContent sx={{ backgroundColor: 'white', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                  <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                    <Table sx={{ backgroundColor: 'transparent' }} size="small" aria-label="simple table">
                      <TableHead sx={{ backgroundColor: 'transparent' }}>
                        <TableRow sx={{ backgroundColor: 'transparent' }}>
                          <TableCell sx={tableCell1Sx}>Label:</TableCell>
                          <TableCell align="right" sx={tableCell1Sx}>Confidence:</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody sx={{ backgroundColor: 'transparent' }}>
                        <TableRow sx={{ backgroundColor: 'transparent' }}>
                          <TableCell component="th" scope="row" sx={tableCellSx}>
                            {data.class}
                          </TableCell>
                          <TableCell align="right" sx={tableCellSx}>{confidence}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              )}
              {isLoading && (
                <CardContent sx={{ backgroundColor: 'white', display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                  <CircularProgress sx={{ color: '#be6a77' }} />
                  <Typography variant="h6" noWrap>
                    Processing
                  </Typography>
                </CardContent>
              )}
            </Card>
          </Grid>
          {data && (
            <Grid item sx={{ maxWidth: '416px', width: '100%' }}>
              <ColorButton
                variant="contained"
                sx={{
                  width: '-webkit-fill-available',
                  borderRadius: '15px',
                  padding: '15px 22px',
                  color: '#000000a6',
                  fontSize: '20px',
                  fontWeight: 900,
                }}
                color="primary"
                component="span"
                size="large"
                onClick={clearData}
                startIcon={<Clear fontSize="large" />}
              >
                Clear
              </ColorButton>
            </Grid>
          )}
        </Grid>
      </Container>
    </React.Fragment>
  );
};
