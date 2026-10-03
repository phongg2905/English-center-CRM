import React from 'react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody, Badge, Button } from '../../components/ui';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  taskTag: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, subtitle, taskTag }) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card variant="elevated">
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardSubtitle>{subtitle}</CardSubtitle>
            </div>
            <Badge variant="brand">{taskTag}</Badge>
          </div>
        </CardHeader>
        <CardBody style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(124, 58, 237, 0.1)',
              color: 'var(--color-primary-royal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Construction size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
            Mô-đun đang trong lộ trình triển khai Sprint kế tiếp
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            Hệ thống Routing và phân quyền đã kích hoạt thành công cho mô-đun này. Giao diện chi tiết sẽ được hoàn thiện theo đúng User Story của đồ án.
          </p>
          <Button
            variant="glass"
            iconLeft={<ArrowLeft size={16} />}
            onClick={() => navigate('/dashboard')}
          >
            Quay lại Tổng quan Dashboard
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};
