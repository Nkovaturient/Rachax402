import Header from '../components/Header';
import ServiceSelector from '../components/ServiceSelector';
import FileUploader from '../components/FileUploader';
import ProgressStepper from '../components/ProgressStepper';
import PaymentModal from '../components/PaymentModal';
import ResultsViewer from '../components/ResultsViewer';
import RatingModal from '../components/RatingModal';
import TransactionStatus from '../components/TransactionStatus';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20">
        <ServiceSelector />
        <FileUploader />
        <TransactionStatus />
        <ProgressStepper />
        <ResultsViewer />
      </main>
      <PaymentModal />
      <RatingModal />
    </div>
  );
};

export default Index;
