import React from 'react'; 
import { Container, Text, Box, Image, Button, Flex } from '@chakra-ui/react';
import profileImage from '../../../assets/profile.png';
import { Link } from 'react-router-dom';

const AuthScreen = () => {
  return (
    <Container maxW="container.xl" centerContent h="100vh" py={10} bg="gray.50">
      <Box textAlign="center" mb={10}>
        <Text fontSize="5xl" fontWeight="bold" color="teal.500">
          THDC Complaint Management System
        </Text>
        <Text fontSize="xl" mt={2} color="gray.600">
          Choose Your Preferred Login Below!
        </Text>
      </Box>
      <Flex justify="center" align="center" wrap="wrap" gap={10} w="100%">
        <Box
          p={6}
          borderWidth={1}
          borderRadius="lg"
          overflow="hidden"
          textAlign="center"
          bg="white"
          boxShadow="md"
          flex="1"
          maxW="md"
          h="350px"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Image
            src={profileImage}
            alt="Admin Login"
            borderRadius="full"
            w="50%"
            mb={4}
          />
          <Link to='/authAdmin'>
          <Button colorScheme="red" textColor='white' size="lg">
            Admin Login
          </Button>
          </Link>
        </Box>
        <Box
          p={6}
          borderWidth={1}
          borderRadius="lg"
          overflow="hidden"
          textAlign="center"
          bg="white"
          boxShadow="md"
          flex="1"
          maxW="md"
          h="350px"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Image
            src={profileImage}
            alt="Employee Login"
            borderRadius="full"
            w="50%"
            mb={4}
          />
          <Link to ='/authEmployee'>
          <Button colorScheme="blue" size="lg">
            Employee Login
          </Button>
          </Link>
        </Box>
      </Flex>
    </Container>
  );
};

export default AuthScreen;
