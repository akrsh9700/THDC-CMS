import React, { useContext, useEffect } from 'react';
import { 
  Box, 
  Table, 
  Heading, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  TableContainer, 
  Text, 
  Tag, 
  Spinner, 
  Center, 
  Alert, 
  AlertIcon,
  useColorModeValue
} from '@chakra-ui/react';
import { EmployeeContext } from '../context/EmployeeContext';
import moment from 'moment';
import { Complaint } from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import { getAllMyComplaints } from '../../Redux/Actions/ComplaintAction';
import { ThunkDispatch } from 'redux-thunk';
import { RootState } from '../../Redux/store';
import { AnyAction } from 'redux';

const ClosedComplaints: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, unknown, AnyAction>>();
  const employeeContext = useContext(EmployeeContext);
  const { loading, error, isGetComplaint } = useSelector((state: RootState) => state.getAllMyComplaint);
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  
  // Load complaints data
  useEffect(() => {
    if (!loading && !isGetComplaint) {
      dispatch(getAllMyComplaints());
    }
  }, [dispatch, loading, isGetComplaint]);
  
  // Loading and error states
  if (loading) {
    return <Center h="100%" p={10}><Spinner size="xl" color="teal.500" thickness="4px" /></Center>;
  }
  
  if (error) {
    return (
      <Alert status="error" borderRadius="md" m={5}>
        <AlertIcon />
        <Text>Error loading complaints: {error}</Text>
      </Alert>
    );
  }
  
  if (!employeeContext) {
    return (
      <Alert status="info" borderRadius="md" m={5}>
        <AlertIcon />
        <Text>Loading complaint data...</Text>
      </Alert>
    );
  }
  
  // Filter closed complaints
  const { allMyComplaints } = employeeContext;
  const closedComplaints = allMyComplaints.filter(com => com.status === 'Closed');

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('MMM D, YYYY');
  };

  // Get status color
  const getStatusColor = (status: string): string => 
    status === 'Opened' ? 'green' : status === 'Closed' ? 'red' : status === 'Processing' ? 'yellow' : 'gray';

  // No closed complaints
  if (closedComplaints.length === 0) {
    return (
      <Box
        bg={bgColor}
        p={5}
        borderRadius="lg"
        boxShadow="sm"
        border="1px solid"
        borderColor={borderColor}
      >
        <Alert 
          status="info" 
          borderRadius="md" 
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <Text mt={4} mb={1} fontSize="lg">No Closed Complaints</Text>
          <Text>You don't have any closed complaints at the moment.</Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      p={5}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={borderColor}
    >
      <Heading as="h2" size="lg" mb={6} color={textColor}>Closed Complaints</Heading>
      <TableContainer>
        <Table variant="simple">
          <Thead bg={headerBgColor}>
            <Tr>
              <Th>ID</Th>
              <Th>Asset</Th>
              <Th>Location</Th>
              <Th>Created</Th>
              <Th>Closed</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {closedComplaints.map((complaint: Complaint) => (
              <Tr key={complaint._id}>
                <Td fontWeight="medium">{complaint.complaint_id}</Td>
                <Td>{complaint.complaint_asset}</Td>
                <Td>{complaint.employee_location}</Td>
                <Td>{formatDate(complaint.created_date)}</Td>
                <Td>{formatDate(complaint.closed_date)}</Td>
                <Td>
                  <Tag colorScheme={getStatusColor(complaint.status)}>
                    {complaint.status}
                  </Tag>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClosedComplaints; 